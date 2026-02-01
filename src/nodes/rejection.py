from typing import Any, Dict
from src.state import AgentState

def handle_rejection_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Handles job rejection by removing it from the list and returning to selection.
    """
    print("--- [Node] Handle Rejection ---")
    
    current_job = state.get("current_job")
    rejected_jobs = state.get("rejected_jobs", [])
    found_jobs = state.get("found_jobs", [])
    analysis_results = state.get("analysis_results", [])
    
    # Mark current job as rejected
    if current_job:
        rejected_jobs.append(current_job.id)
        print(f"Rejected job: {current_job.title}")
    
    # Filter out rejected jobs from the list
    remaining_jobs = []
    remaining_analysis = []
    
    for job, fit in zip(found_jobs, analysis_results):
        if job.id not in rejected_jobs:
            remaining_jobs.append(job)
            remaining_analysis.append(fit)
    
    if remaining_jobs:
        print(f"{len(remaining_jobs)} jobs remaining after rejection")
        return {
            "found_jobs": remaining_jobs,
            "analysis_results": remaining_analysis,
            "rejected_jobs": rejected_jobs,
            "user_action": None,  # Reset user action
            "application_status": "awaiting_selection",
            "current_job": None,  # Clear current job
            "current_fit": None,
            "tailored_resume": None,  # Clear tailored content
            "cover_letter": None,
            "feedback_msg": f"{len(remaining_jobs)} jobs remaining. Select one to continue."
        }
    else:
        # No more jobs in the list
        return {
            "rejected_jobs": rejected_jobs,
            "user_action": None,
            "application_status": "no_more_jobs",
            "current_job": None,
            "current_fit": None,
            "feedback_msg": "All jobs rejected. No more opportunities available."
        }
