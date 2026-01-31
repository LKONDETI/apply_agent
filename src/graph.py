from langgraph.graph import StateGraph, END
from src.state import AgentState
from src.nodes.ingestion import parse_resume_node
from src.nodes.search import find_jobs_node
from src.nodes.analysis import analyze_jobs_node
from src.nodes.tailoring import tailor_application_node
from src.nodes.action import submit_application_node

def create_graph(checkpointer=None):
    """
    Constructs the Job Application Agent Graph.
    """
    workflow = StateGraph(AgentState)
    
    # Add Nodes
    workflow.add_node("parse_resume", parse_resume_node)
    workflow.add_node("find_jobs", find_jobs_node)
    workflow.add_node("analyze_jobs", analyze_jobs_node)
    workflow.add_node("tailor_application", tailor_application_node)
    workflow.add_node("submit_application", submit_application_node)
    
    # Define Edges
    workflow.set_entry_point("parse_resume")
    
    workflow.add_edge("parse_resume", "find_jobs")
    workflow.add_edge("find_jobs", "analyze_jobs")
    
    # Conditional logic after analysis
    def check_match(state):
        if state.get("application_status") == "no_match_found":
            return "end"
        return "continue"
        
    workflow.add_conditional_edges(
        "analyze_jobs",
        check_match,
        {
            "end": END,
            "continue": "tailor_application"
        }
    )
    
    workflow.add_edge("tailor_application", "submit_application")
    workflow.add_edge("submit_application", END)
    
    # Compile with MemorySaver to support interrupts/checkpointing
    # Although MemorySaver isn't strictly needed for just 'interrupt', it's good practice.
    # BUT, to interrupt, we must pass interrupt_before to compile().
    
    return workflow.compile(interrupt_before=["submit_application"], checkpointer=checkpointer)
