from langgraph.graph import StateGraph, END
from src.state import AgentState
from src.nodes.ingestion import parse_resume_node
from src.nodes.search import find_jobs_node
from src.nodes.analysis import analyze_jobs_node
from src.nodes.tailoring import tailor_application_node
from src.nodes.action import submit_application_node
from src.nodes.rejection import handle_rejection_node

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
    workflow.add_node("handle_rejection", handle_rejection_node)
    
    # Define Edges
    workflow.set_entry_point("parse_resume")
    
    workflow.add_edge("parse_resume", "find_jobs")
    workflow.add_edge("find_jobs", "analyze_jobs")
    
    # After analysis, check if jobs found
    def check_analysis_result(state):
        status = state.get("application_status")
        if status == "no_match_found":
            return "end"
        elif status == "awaiting_selection":
            # Jobs analyzed, waiting for user to select one
            return "wait_selection"
        return "continue"
    
    workflow.add_conditional_edges(
        "analyze_jobs",
        check_analysis_result,
        {
            "end": END,
            "wait_selection": "tailor_application",  # Will interrupt before this
            "continue": "tailor_application"
        }
    )
    
    workflow.add_edge("tailor_application", "submit_application")
    
    # Conditional after submission - check if user rejected
    def check_user_action(state):
        user_action = state.get("user_action")
        if user_action == "reject":
            return "rejected"
        elif user_action == "approve":
            return "approved"
        return "approved"  # Default to approved when resuming from interrupt
    
    workflow.add_conditional_edges(
        "submit_application",
        check_user_action,
        {
            "rejected": "handle_rejection",
            "approved": END
        }
    )
    
    # After handling rejection, check if we found another job
    def check_rejection_result(state):
        status = state.get("application_status")
        if status == "no_more_jobs":
            return "end"
        return "retry"  # Go back to tailor the new job
    
    workflow.add_conditional_edges(
        "handle_rejection",
        check_rejection_result,
        {
            "end": END,
            "retry": "tailor_application"
        }
    )
    
    # Compile with interrupts:
    # 1. After analyze_jobs (for job selection)
    # 2. Before submit_application (for review)
    return workflow.compile(
        interrupt_before=["tailor_application", "submit_application"],
        checkpointer=checkpointer
    )
