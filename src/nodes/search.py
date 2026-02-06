from typing import Any, Dict
from src.state import AgentState
from src.modules.search import get_search_provider

def find_jobs_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Searches for relevant jobs using location and role filters.
    """
    print("--- [Node] Find Jobs ---")
    
    parsed = state.get("parsed_resume")
    if not parsed:
        return {"feedback_msg": "No parsed resume found to base search on."}
    
    # Get search parameters from state
    search_role = state.get("search_role", "Software Engineer")
    search_location = state.get("search_location", "Remote")
    search_job_type = state.get("search_job_type", "Full-time")
    search_limit = state.get("search_limit", 5)
    
    # Use role from state, fallback to parsed skills
    query = search_role
    if not query and parsed.skills:
        query = parsed.skills[0]
    
    # Include job type in query for better filtering
    if search_job_type:
        query = f"{search_job_type} {query}"
        
    print(f"Searching for: {query} in {search_location} (limit: {search_limit})")
        
    provider = get_search_provider("ddg") # Use Real Search
    jobs = provider.find_jobs(query=query, location=search_location)
    
    # Filter DB duplicates
    from src.database import get_application
    new_jobs = []
    for job in jobs:
        if not get_application(job.id):
            new_jobs.append(job)
            if len(new_jobs) >= search_limit:
                break
        else:
            print(f"Skipping duplicate job: {job.title}")
            
    print(f"Found {len(new_jobs)} new jobs (filtered from {len(jobs)}).")
    
    return {
        "found_jobs": new_jobs,
        "feedback_msg": f"Found {len(new_jobs)} new potential jobs."
    }
