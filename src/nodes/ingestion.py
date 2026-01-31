from typing import Any, Dict
from src.state import AgentState
from src.modules.parser import ResumeParser
from src.modules.analyzer import Analyzer

def parse_resume_node(state: AgentState) -> Dict[str, Any]:
    """
    Node: Loads resume file, extracts text, and structures it.
    """
    print("--- [Node] Parse Resume ---")
    
    # In a real app, file path might come from input args or config
    # For now, we assume it's passed or we look for a default
    # Let's assume the user passes 'resume_path' in the initial input
    # If not, we might need to ask or look in a folder. 
    # For this graph, we assume state has 'resume_text' OR we load it here.
    
    # We'll assume the initial input key isn't strictly typed yet in this specific func signature
    # but the state dict will have it.
    
    # HACK: For the demo, let's say input is 'resume_path'
    resume_path = state.get("resume_path", "resume.pdf")
    
    try:
        raw_text = ResumeParser.parse_file(resume_path)
    except Exception as e:
        print(f"Error parsing file: {e}")
        # If we can't parse, maybe we used provided text?
        raw_text = state.get("resume_text", "")
        if not raw_text:
            return {"feedback_msg": f"Failed to parse resume: {e}"}

    analyzer = Analyzer()
    parsed = analyzer.structured_resume(raw_text)
    
    return {
        "resume_text": raw_text,
        "parsed_resume": parsed,
        "feedback_msg": "Resume parsed successfully."
    }
