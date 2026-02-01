from typing import Any, Dict
from src.state import AgentState
from src.modules.analyzer import Analyzer

def analyze_jobs_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Scores all found jobs and prepares them for user selection.
    """
    print("--- [Node] Analyze Jobs ---")
    
    jobs = state.get("found_jobs", [])
    resume = state["parsed_resume"]
    analyzer = Analyzer()
    
    if not jobs:
        return {
            "application_status": "no_match_found",
            "feedback_msg": "No jobs found to analyze.",
            "analysis_results": []
        }
    
    # Analyze ALL jobs (not just first 3)
    analysis_results = []
    for job in jobs:
        fit = analyzer.analyze_fit(resume, job)
        analysis_results.append(fit)
        print(f"Job: {job.title} | Score: {fit.score}")
    
    # Sort by score descending
    sorted_results = sorted(
        zip(jobs, analysis_results),
        key=lambda x: x[1].score,
        reverse=True
    )
    
    return {
        "analysis_results": [result for _, result in sorted_results],
        "found_jobs": [job for job, _ in sorted_results],  # Re-order jobs by score
        "application_status": "awaiting_selection",
        "feedback_msg": f"Analyzed {len(jobs)} jobs. Ready for user selection."
    }
