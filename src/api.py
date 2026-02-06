from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import os

from langgraph.checkpoint.memory import MemorySaver
from src.graph import create_graph
from src.database import create_db_and_tables, get_application
from sqlmodel import Session, select, create_engine
from src.config import settings

# Initialize DB
create_db_and_tables()

app = FastAPI(title="Job Application Agent API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory graph storage for demo (re-initialized on server restart)
# In production, use PostgresSaver
memory = MemorySaver()
# agent_graph = create_graph_with_checkpointer(memory) # REMOVED

# Refactor: We need the graph compiled with the checkpointer outside main.py
# Let's import the one from src/graph.py but we need to inject the checkpointer.
# Or we use a global memory here.
# Since `src/graph.py` doesn't take arguments in my current implementation, 
# I will patch it or import the `state_graph` before compilation if possible, 
# OR just re-implement the compile step here using the function.

# Let's import `create_graph` from src/graph.py. 
# Wait, `src.graph.create_graph` returns `workflow.compile(interrupt_before=...)`.
# It does NOT attach a checkpointer by default in that file!
# I need to modify `src/graph.py` to accept a checkpointer or attach it here.
# `workflow.compile(checkpointer=memory, ...)`
# I will hot-patch or modify `src/graph.py` first. For now, I'll assume I can pass it.

# Actually, let's redefine the proper graph setup here to be safe and clear.
from src.state import AgentState
from src.graph import create_graph as build_compiled_graph 
# My specific implementation of create_graph in src/graph.py handles compilation logic.
# I should update src/graph.py to take an optional checkpointer.

# --- API Models ---
class RunRequest(BaseModel):
    resume_path: str = "resume.pdf"
    location: str = "Remote"
    role: str = "Software Engineer"
    job_type: str = "Full-time"
    
class RunResponse(BaseModel):
    thread_id: str
    status: str
    message: str
    jobs: Optional[List[Dict[str, Any]]] = None

class ApprovalRequest(BaseModel):
    thread_id: str
    action: str # "approve" or "reject"
    feedback: Optional[str] = None

class GenerateRequest(BaseModel):
    thread_id: str
    job_id: str

class AgentStateResponse(BaseModel):
    thread_id: str
    current_status: str
    job_details: Optional[Dict[str, Any]] = None
    tailored_resume: Optional[str] = None
    cover_letter: Optional[str] = None
    next_step: Optional[str] = None
    jobs: Optional[List[Dict[str, Any]]] = None

# --- Graph Manager (Singleton-ish) ---
# We need to modify `src/graph.py` to allow passing the checkpointer.
# For now, I will use a helper to attach it if possible, but LangGraph compilation is final.
# Strategy: I'll rewrite `create_graph` in `src/graph.py` in the next tool call to be more flexible.
# For this file, I'll assume `src.graph.create_graph` takes `checkpointer`.

# Placeholder for the graph instance
graph_app = None

@app.on_event("startup")
def startup_event():
    global graph_app
    from src.graph import create_graph
    # We will need to update create_graph to accept checkpointer
    graph_app = create_graph(checkpointer=memory)

@app.post("/run", response_model=RunResponse)
def start_run(req: RunRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    # Initial state with search filters
    initial_state = {
        "resume_path": req.resume_path,
        "search_location": req.location,
        "search_role": req.role,
        "search_job_type": req.job_type,
        "search_limit": 5
    }
    
    try:
        # Run until first interrupt (tailor_application after analysis)
        events = graph_app.invoke(initial_state, config=config)
        
        # Check where it stopped
        snapshot = graph_app.get_state(config)
        next_step = snapshot.next if snapshot.next else "done"
        state_values = snapshot.values
        
        # If we paused after analysis, return job list
        if state_values.get("application_status") == "awaiting_selection":
            jobs = state_values.get("found_jobs", [])
            analysis_results = state_values.get("analysis_results", [])
            
            # Format jobs with scores
            job_list = []
            for i, (job, fit) in enumerate(zip(jobs, analysis_results)):
                job_list.append({
                    "id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "url": job.url,
                    "score": fit.score,
                    "description": job.description[:200] if hasattr(job, 'description') else ""
                })
            
            return RunResponse(
                thread_id=thread_id,
                status="awaiting_selection",
                message=f"Found {len(job_list)} jobs. Select one to generate application.",
                jobs=job_list
            )
        
        status = "finished" if not snapshot.next else "paused"
        
        return RunResponse(
            thread_id=thread_id, 
            status=status,
            message=f"Agent started. Current step: {next_step}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{thread_id}", response_model=AgentStateResponse)
def get_status(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = graph_app.get_state(config)
        if not snapshot.values:
             raise HTTPException(status_code=404, detail="Thread not found")
        
        state = snapshot.values
        job = state.get("current_job")
        
        job_details = None
        if job:
            job_details = job.model_dump() # Pydantic v2
        
        # Format jobs list if in selection mode
        jobs_list = None
        if state.get("application_status") == "awaiting_selection":
            jobs = state.get("found_jobs", [])
            analysis_results = state.get("analysis_results", [])
            jobs_list = []
            for job, fit in zip(jobs, analysis_results):
                jobs_list.append({
                    "id": job.id,
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "url": job.url,
                    "score": fit.score
                })
            
        return AgentStateResponse(
            thread_id=thread_id,
            current_status=state.get("application_status", "unknown"),
            job_details=job_details,
            tailored_resume=state.get("tailored_resume"),
            cover_letter=state.get("cover_letter"),
            next_step=str(snapshot.next),
            jobs=jobs_list
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/approve", response_model=RunResponse)
def approve_run(req: ApprovalRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    if req.action == "reject":
        try:
            # Update the state with rejection signal
            graph_app.update_state(
                config,
                {"user_action": "reject"}
            )
            
            # Resume the graph - it will process rejection and return to selection
            graph_app.invoke(None, config=config)
            
            # Get updated state
            snapshot = graph_app.get_state(config)
            status = "finished" if not snapshot.next else "paused"
            state_values = snapshot.values
            
            # Check if we're back at job selection
            if state_values.get("application_status") == "awaiting_selection":
                jobs = state_values.get("found_jobs", [])
                analysis_results = state_values.get("analysis_results", [])
                
                # Format remaining jobs
                job_list = []
                for job, fit in zip(jobs, analysis_results):
                    job_list.append({
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "url": job.url,
                        "score": fit.score
                    })
                
                return RunResponse(
                    thread_id=req.thread_id,
                    status="awaiting_selection",
                    message=f"{len(job_list)} jobs remaining. Select another one.",
                    jobs=job_list
                )
            elif state_values.get("application_status") == "no_more_jobs":
                return RunResponse(
                    thread_id=req.thread_id,
                    status="finished",
                    message="All jobs rejected. No more opportunities available."
                )
            else:
                return RunResponse(
                    thread_id=req.thread_id,
                    status=status,
                    message="Rejection processed."
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    if req.action == "approve":
        # Resume the graph with approval signal
        try:
            # Update state with approval
            graph_app.update_state(
                config,
                {"user_action": "approve"}
            )
            
            # Resume
            graph_app.invoke(None, config=config)
            
            snapshot = graph_app.get_state(config)
            status = "finished" if not snapshot.next else "paused"
            
            return RunResponse(
                thread_id=req.thread_id,
                status=status,
                message="Application submitted successfully."
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    raise HTTPException(status_code=400, detail="Invalid action")

@app.post("/generate", response_model=RunResponse)
def generate_application(req: GenerateRequest):
    """
    Selects a specific job and generates tailored application materials.
    """
    config = {"configurable": {"thread_id": req.thread_id}}
    
    try:
        snapshot = graph_app.get_state(config)
        if not snapshot.values:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        state = snapshot.values
        jobs = state.get("found_jobs", [])
        analysis_results = state.get("analysis_results", [])
        
        # Find the selected job
        selected_job = None
        selected_fit = None
        for job, fit in zip(jobs, analysis_results):
            if job.id == req.job_id:
                selected_job = job
                selected_fit = fit
                break
        
        if not selected_job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Update state with selected job
        graph_app.update_state(
            config,
            {
                "current_job": selected_job,
                "current_fit": selected_fit,
                "application_status": "generating"
            }
        )
        
        # Resume graph - it will go to tailor_application then interrupt at submit_application
        graph_app.invoke(None, config=config)
        
        # Get updated state with tailored content
        snapshot = graph_app.get_state(config)
        status = "finished" if not snapshot.next else "paused"
        
        return RunResponse(
            thread_id=req.thread_id,
            status=status,
            message="Application generated. Ready for review."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_history():
    from src.database import Application, engine
    with Session(engine) as session:
        statement = select(Application).order_by(Application.applied_at.desc())
        results = session.exec(statement).all()
        return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
