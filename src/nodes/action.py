from typing import Any, Dict
from src.state import AgentState
from src.modules.browser import ApplicationSubmitter

def submit_application_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Submits the application via browser.
    """
    print("--- [Node] Submit Application ---")
    
    job = state.get("current_job")
    # For the mock, we need a file path for the resume. 
    # In a real app, we might write the tailored markdown to a temporary PDF/DOCX.
    # Here we'll just pass a placeholder path.
    resume_path = state.get("resume_path", "dummy_tailored_resume.pdf") 
    cover_letter = state.get("cover_letter", "")
    
    submitter = ApplicationSubmitter()
    status = submitter.apply(job, resume_path, cover_letter)
    
    # Save to Database
    from src.database import create_application_record
    
    # We need fit_score from the state, let's grab it from current_fit
    fit_score = 0
    if state.get("current_fit"):
        fit_score = state["current_fit"].score
        
    create_application_record(
        job_id=job.id,
        title=job.title,
        company=job.company,
        url=job.url,
        fit_score=fit_score,
        tailored_resume="... (path to resume artifact) ...", # Placeholder for path
        cover_letter=cover_letter
    )
    
    return {
        "application_status": "submitted",
        "feedback_msg": f"{status} Saved to DB."
    }
