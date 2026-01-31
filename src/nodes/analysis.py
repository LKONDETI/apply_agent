from typing import Any, Dict
from src.state import AgentState
from src.modules.analyzer import Analyzer

def analyze_jobs_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Scores found jobs and selects the best one (or current one).
    For simplicity in this linear graph, we'll just pick the first one that fits well.
    """
    print("--- [Node] Analyze Jobs ---")
    
    jobs = state.get("found_jobs", [])
    resume = state["parsed_resume"]
    analyzer = Analyzer()
    
    best_fit = None
    best_job = None
    
    # Limit to analyzing first 3 for speed in demo
    for job in jobs[:3]:
        fit = analyzer.analyze_fit(resume, job)
        print(f"Job: {job.title} | Score: {fit.score}")
        
        if fit.score >= 70:
            # We found a good candidate
            best_fit = fit
            best_job = job
            break
            
    if best_job:
        return {
            "current_job": best_job,
            "current_fit": best_fit,
            "application_status": "analyzed"
        }
    else:
        return {
            "application_status": "no_match_found",
            "feedback_msg": "No jobs met the threshold."
        }
