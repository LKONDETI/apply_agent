from typing import Any, Dict
from src.state import AgentState
from src.modules.generator import Generator

def tailor_application_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Generates tailored resume and cover letter.
    """
    print("--- [Node] Tailor Application ---")
    
    job = state.get("current_job")
    resume = state.get("parsed_resume")
    
    if not job or not resume:
        return {"feedback_msg": "Missing job or resume data for tailoring."}
        
    generator = Generator()
    
    tailored_cv = generator.tailor_resume(resume, job)
    cover_letter = generator.generate_cover_letter(resume, job)
    
    return {
        "tailored_resume": tailored_cv,
        "cover_letter": cover_letter,
        "application_status": "ready_for_review"
    }
