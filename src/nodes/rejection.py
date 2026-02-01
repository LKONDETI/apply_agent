from typing import Any, Dict
from src.state import AgentState

def handle_rejection_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Handles job rejection and finds next candidate.
    """
    print("--- [Node] Handle Rejection ---")
    
    current_job = state.get("current_job")
    rejected_jobs = state.get("rejected_jobs", [])
    found_jobs = state.get("found_jobs", [])
    
    # Mark current job as rejected
    if current_job:
        rejected_jobs.append(current_job.id)
        print(f"Rejected job: {current_job.title}")
    
    # Find next job that hasn't been rejected or analyzed yet
    from src.modules.analyzer import Analyzer
    resume = state["parsed_resume"]
    analyzer = Analyzer()
    
    next_job = None
    next_fit = None
    
    # Look through remaining jobs
    for job in found_jobs:
        if job.id not in rejected_jobs:
            # Analyze this job
            fit = analyzer.analyze_fit(resume, job)
            print(f"Analyzing next job: {job.title} | Score: {fit.score}")
            
            if fit.score >= 70:
                next_job = job
                next_fit = fit
                break
    
    if next_job:
        return {
            "current_job": next_job,
            "current_fit": next_fit,
            "rejected_jobs": rejected_jobs,
            "user_action": None,  # Reset user action
            "application_status": "pending_review",
            "feedback_msg": f"Found new opportunity: {next_job.title}"
        }
    else:
        # No more suitable jobs in current batch
        return {
            "rejected_jobs": rejected_jobs,
            "user_action": None,
            "application_status": "no_more_jobs",
            "feedback_msg": "No more suitable jobs found. Need to search again."
        }
