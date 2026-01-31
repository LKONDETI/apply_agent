from playwright.sync_api import sync_playwright
from src.models import JobListing

class ApplicationSubmitter:
    """
    Handles browser interactions to submit applications.
    """
    
    def apply(self, job: JobListing, resume_path: str, cover_letter: str) -> str:
        """
        Launches browser, navigates to job URL, and attempts to apply.
        Returns status message.
        """
        # In a real scenario, we'd need complex logic to handle different job sites.
        # For this MVP/Mock, we will just open the page and "pretend" to fill it.
        # Or better, we visualize it for the user.
        
        with sync_playwright() as p:
            # Launch in headed mode so the user can see (or headless if preferred)
            # For "Human-in-the-loop" application, headed is better.
            browser = p.chromium.launch(headless=False)
            page = browser.new_page()
            
            try:
                print(f"Navigating to {job.url}...")
                page.goto(job.url)
                
                # Verify page load
                page.wait_for_load_state("networkidle")
                
                # Mock Action: Highlight where we would apply
                # In a real tool, we might look for 'Apply' buttons:
                # page.click("text=Apply")
                 
                print("Automating application form filling... (Mock)")
                # Assume success for the mock
                result = "Application submitted successfully (Mock)."
                
                # Keep open briefly for visual confirmation if needed
                page.wait_for_timeout(2000)
                
            except Exception as e:
                result = f"Failed to apply: {e}"
            finally:
                browser.close()
                
        return result
