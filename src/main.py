import dotenv
import os
import sys
from langgraph.checkpoint.memory import MemorySaver
from src.graph import create_graph

# Load environment variables
dotenv.load_dotenv()

def main():
    """
    Main entry point for the Job Application Agent.
    """
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please create a .env file based on .env.example")
        sys.exit(1)

    print("--- Job Application Agent Initialized ---")
    
    # Initialize DB
    from src.database import create_db_and_tables
    create_db_and_tables()
    
    # Initialize Graph with Checkpointer
    memory = MemorySaver()
    app = create_graph()
    
    # Configure input
    # In a real app, we'd accept CLI args for the resume path
    resume_path = "resume.pdf" # Placeholder default
    initial_state = {"resume_path": resume_path}
    
    # For testing, if no resume exists, we can inject raw text directly
    if not os.path.exists(resume_path):
        print(f"Warning: {resume_path} not found. Using Mock Resume Text.")
        initial_state["resume_text"] = """
        John Doe
        Senior Software Engineer
        
        EXPERIENCE
        Tech Corp - Senior Engineer (2020-Present)
        - Built scalable APIs using Python and FastAPI.
        - Implemented LangGraph agents.
        
        SKILLS
        Python, LangChain, Docker, SQL, React
        """
        initial_state["resume_path"] = "mock_resume.txt"

    thread = {"configurable": {"thread_id": "1"}}

    print("Starting process...")
    
    # Run until interrupt (Human Review)
    for event in app.stream(initial_state, thread, stream_mode="values"):
        status = event.get("application_status")
        msg = event.get("feedback_msg")
        if msg:
            print(f"> {msg}")
        if status:
            print(f"Status: {status}")
            
    # Check current state after run (should pause at 'tailor_application' before 'submit_application' because of manual interrupt setting? 
    # Wait, in the graph I defined `workflow.add_edge("tailor_application", "submit_application")`.
    # To make it interrupt, I need to use `interrupt_before=["submit_application"]` in compile().
    # Let's fix the graph compilation in this file or update src/graph.py.
    # It is cleaner to update logic here if I can, but compile() happens in create_graph. 
    # I should update create_graph to accept interrupt args or hardcode it there.
    # For now, I'll assumet it runs through.
    
    # WAIT! The USER requested "Require human approval before applying". 
    # I need to modify src/graph.py to add `interrupt_before`.
    
    # Re-compiling graph logic here properly would be:
    # app = create_graph(interrupt_before=["submit_application"]) 
    # But my create_graph function doesn't take args. 
    # I will modify src/graph.py in the next step to support this.
    
    print("\n--- Workflow Completed (or Paused) ---")

if __name__ == "__main__":
    main()
