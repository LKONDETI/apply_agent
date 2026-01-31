from typing import Any, Dict
from src.state import AgentState
from src.modules.search import get_search_provider

def find_jobs_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Searches for relevant jobs.
    """
    print("--- [Node] Find Jobs ---")
    
    parsed = state.get("parsed_resume")
    if not parsed:
        return {"feedback_msg": "No parsed resume found to base search on."}
        
    # Construct a query
    query = "Software Engineer"
    if parsed.skills:
        query = parsed.skills[0]
        
    provider = get_search_provider("ddg") # Use Real Search
    jobs = provider.find_jobs(query=query, location="Remote")
    
    # Filter DB duplicates
    from src.database import get_application
    new_jobs = []
    for job in jobs:
        if not get_application(job.id):
            new_jobs.append(job)
        else:
            print(f"Skipping duplicate job: {job.title}")
            
    print(f"Found {len(new_jobs)} new jobs (filtered from {len(jobs)}).")
    
    return {
        "found_jobs": new_jobs,
        "feedback_msg": f"Found {len(new_jobs)} new potential jobs."
    }
