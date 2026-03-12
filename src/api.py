from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import os
from pathlib import Path

from langgraph.checkpoint.memory import MemorySaver
from src.graph import create_graph
from src.database import create_db_and_tables, get_application
from sqlmodel import Session, select, create_engine
from src.config import settings

# Initialize DB
create_db_and_tables()

# Directory to store uploaded resumes — absolute path so it works regardless of CWD
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Shared checkpointer + graph — initialized eagerly so the app works even if
# the lifespan hook doesn't fire (e.g. TestClient or direct imports).
memory = MemorySaver()
graph_app = create_graph(checkpointer=memory)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Re-confirm uploads directory exists on startup
    UPLOADS_DIR.mkdir(exist_ok=True)
    yield  # app is running
    # (cleanup on shutdown goes here if needed)

app = FastAPI(title="Job Application Agent API", lifespan=lifespan)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Models ---
class RunRequest(BaseModel):
    resume_path: str = "resume.pdf"
    location: str = "Remote"
    role: str = "Software Engineer"
    job_type: str = "Full-time"
    time_posted: str = "any"  # "any", "24h", "3d", "7d", "14d", "30d"
    
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




ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Accepts a resume file (PDF, DOCX, or TXT), saves it to the uploads/ directory,
    and returns the saved file path to be passed into the /run endpoint.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload a PDF, DOCX, or TXT file."
        )

    # Use UUID prefix to avoid filename collisions
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = UPLOADS_DIR / unique_filename

    try:
        # Use await file.read() for proper async file handling.
        # shutil.copyfileobj on a SpooledTemporaryFile can produce a truncated/
        # corrupt file because it doesn't seek to position 0 first.
        contents = await file.read()
        save_path.write_bytes(contents)
    finally:
        await file.close()

    return {
        "resume_path": str(save_path),
        "filename": file.filename,
        "size_bytes": save_path.stat().st_size
    }

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
        "search_time_posted": req.time_posted,
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
