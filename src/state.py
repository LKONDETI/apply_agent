from typing import TypedDict, List, Annotated
import operator
from src.models import Resume, JobListing, JobFit

class AgentState(TypedDict):
    """
    State of the Job Application Agent.
    """
    # User Input
    resume_text: str
    
    # Processed Data
    parsed_resume: Resume
    
    # Search Results
    found_jobs: List[JobListing]
    
    # Current Iteration Context (The loop processes one job at a time or we map over them)
    # For simplicity, let's assume this State handles ONE application flow, or we keep a list of applications.
    # To use LangGraph's power, we might iterate. But for "Batch" processing, we often just list them.
    # Let's keep it simple: The state holds the LIST of opportunities, and we update them.
    # Actually, simpler is: The graph finds jobs, then maps to subgraphs? 
    # Let's stick to the plan: State tracks current focus or list.
    
    analysis_results: List[JobFit]
    
    # We will just track the *current* application getting worked on if we do a loop.
    # Or, we store a list of dicts for "applications".
    # Let's do:
    current_job: JobListing
    current_fit: JobFit
    tailored_resume: str
    cover_letter: str
    
    # Search filters
    search_location: str
    search_role: str
    search_job_type: str
    search_time_posted: str  # "any", "24h", "3d", "7d", "14d", "30d"
    search_limit: int
    resume_path: str
    
    # Rejection tracking
    rejected_jobs: List[str]  # List of job IDs that user rejected
    user_action: str  # "approve", "reject", or None
    
    # Status
    feedback_msg: str
    application_status: str # "pending_review", "approved", "submitted", "skipped"
