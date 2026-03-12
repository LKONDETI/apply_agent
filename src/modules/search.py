from abc import ABC, abstractmethod
from typing import List
from ddgs import DDGS
from src.models import JobListing
import hashlib

# ── Supported job sites ────────────────────────────────────────────────────────
# Maps the value sent from the frontend to the domain used in the site: filter.
SUPPORTED_SITES: dict[str, str] = {
    "":                    "",                       # Global — no filter
    "linkedin.com/jobs":   "linkedin.com/jobs",
    "indeed.com":          "indeed.com",
    "glassdoor.com":       "glassdoor.com",
    "weworkremotely.com":  "weworkremotely.com",
    "greenhouse.io":       "greenhouse.io",
    "lever.co":            "lever.co",
    "builtin.com":         "builtin.com",
    "simplyhired.com":     "simplyhired.com",
}


class JobSearchProvider(ABC):
    """
    Abstract Base Class for Job Search Providers.
    """
    @abstractmethod
    def find_jobs(self, query: str, location: str, limit: int = 5, site: str = "") -> List[JobListing]:
        pass


class MockJobSearch(JobSearchProvider):
    """
    Returns fake jobs for testing purposes.
    """
    def find_jobs(self, query: str, location: str, limit: int = 5, site: str = "") -> List[JobListing]:
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
    Supports optional site: filtering to target a specific job board.
    """
    def find_jobs(self, query: str, location: str, limit: int = 5, site: str = "") -> List[JobListing]:
        search_query = f"{query} jobs in {location}"

        # Append site filter if a specific board was selected
        if site:
            search_query = f"{search_query} site:{site}"

        print(f"DEBUG: Searching DDG for: {search_query}")
        results = DDGS().text(search_query, max_results=limit)
        print(f"DEBUG: Raw Results: {results}")

        jobs = []
        if results:
            for res in results:
                url = res.get('href', '')
                title = res.get('title', 'Unknown Job')
                snippet = res.get('body', '') or res.get('snippet', '')

                job_id = hashlib.md5(url.encode()).hexdigest()

                company = "Unknown Company"
                if "-" in title:
                    parts = title.split("-")
                    company = parts[-1].strip()

                jobs.append(JobListing(
                    id=job_id,
                    title=title,
                    company=company,
                    location=location,
                    url=url,
                    description=snippet,
                    source=site if site else "duckduckgo"
                ))

        return jobs


def get_search_provider(provider_name: str = "ddg") -> JobSearchProvider:
    if provider_name == "mock":
        return MockJobSearch()
    elif provider_name == "ddg":
        return DuckDuckGoJobSearch()

    raise ValueError(f"Unknown provider: {provider_name}")
