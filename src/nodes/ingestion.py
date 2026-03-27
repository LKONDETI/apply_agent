from typing import Any, Dict
from src.state import AgentState
from src.modules.parser import ResumeParser
from src.modules.analyzer import Analyzer

def parse_resume_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Loads resume file, extracts text, and structures it.
    """
    print("--- [Node] Parse Resume ---")
    
    resume_path = state.get("resume_path")
    if not resume_path:
        return {"feedback_msg": "No resume provided. Please upload a resume."}

    try:
        raw_text = ResumeParser.parse_file(resume_path)
    except Exception as e:
        print(f"Error parsing file: {e}")
        return {"feedback_msg": f"Failed to parse resume: {e}"}

    analyzer = Analyzer()
    parsed = analyzer.structured_resume(raw_text)
    
    return {
        "resume_text": raw_text,
        "parsed_resume": parsed,
        "feedback_msg": "Resume parsed successfully."
    }
