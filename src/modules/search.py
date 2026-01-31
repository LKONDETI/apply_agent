from abc import ABC, abstractmethod
from typing import List
# from langchain_community.tools import DuckDuckGoSearchResults
# from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from ddgs import DDGS
from src.models import JobListing
import hashlib

class JobSearchProvider(ABC):
    """
    Abstract Base Class for Job Search Providers.
    """
    @abstractmethod
    def find_jobs(self, query: str, location: str, limit: int = 5) -> List[JobListing]:
        pass

class MockJobSearch(JobSearchProvider):
    """
    Returns fake jobs for testing purposes.
    """
    def find_jobs(self, query: str, location: str, limit: int = 5) -> List[JobListing]:
        return [
            JobListing(
                id="mock-1",
                title="Senior AI Engineer",
                company="Tech Corp",
                location="San Francisco (Remote)",
                url="https://example.com/job/1",
                description="We are looking for an expert in LLMs and LangGraph to build agents.",
                salary_range="$180k - $220k",
                source="mock"
            ),
            JobListing(
                id="mock-2",
                title="Python Backend Developer",
                company="StartUp Inc",
                location="Remote",
                url="https://example.com/job/2",
                description="Join our team to build scalable APIs using FastAPI.",
                salary_range="$120k - $160k",
                source="mock"
            )
        ][:limit]

class DuckDuckGoJobSearch(JobSearchProvider):
    """
    Real web search using DuckDuckGo to find job postings.
    """
    def find_jobs(self, query: str, location: str, limit: int = 5) -> List[JobListing]:
        # search_query = f"{query} jobs in {location} site:greenhouse.io OR site:lever.co OR site:linkedin.com/jobs"
        search_query = f"{query} jobs in {location}"
        
        # Use DDGS directly
        print(f"DEBUG: Searching DDG for: {search_query}")
        results = DDGS().text(search_query, max_results=limit)
        print(f"DEBUG: Raw Results: {results}")
        
        jobs = []
        if results:
            for res in results:
                # res is {'title': '...', 'components': '...', 'snippet': '...', 'body': '...', 'href': '...'}
                # The exact keys depend on version, but usually 'title', 'href', 'body'
                url = res.get('href', '')
                title = res.get('title', 'Unknown Job')
                snippet = res.get('body', '') or res.get('snippet', '')
                
                # Create a deterministic ID from URL
                job_id = hashlib.md5(url.encode()).hexdigest()
                
                # Basic parsing of snippet to guess Company (very naive)
                company = "Unknown Company" 
                if "-" in title:
                    parts = title.split("-")
                    company = parts[-1].strip() # Often "Role - Company"
                
                jobs.append(JobListing(
                    id=job_id,
                    title=title,
                    company=company, 
                    location=location,
                    url=url,
                    description=snippet,
                    source="duckduckgo"
                ))
            
        return jobs

# Factory or Selector
def get_search_provider(provider_name: str = "ddg") -> JobSearchProvider:
    if provider_name == "mock":
        return MockJobSearch()
    elif provider_name == "ddg":
        return DuckDuckGoJobSearch()
        
    raise ValueError(f"Unknown provider: {provider_name}")
