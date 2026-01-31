from typing import List, Optional
from pydantic import BaseModel, Field

class Resume(BaseModel):
    """
    Structured representation of a user's resume.
    """
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list, description="List of work experience entries")
    education: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    raw_text: str = Field(..., description="The full raw text content of the resume")

class JobListing(BaseModel):
    """
    Standardized job listing format.
    """
    id: str = Field(..., description="Unique identifier or URL hash")
    title: str
    company: str
    location: Optional[str] = None
    url: str
    description: str
    salary_range: Optional[str] = None
    source: str = "unknown"

class JobFit(BaseModel):
    """
    Evaluation of how well a resume matches a job.
    """
    job_id: str
    score: int = Field(..., description="Fit score out of 100")
    reasoning: str
    missing_skills: List[str] = Field(default_factory=list)

class ApplicationData(BaseModel):
    """
    Data prepared for a specific job application.
    """
    job_id: str
    tailored_resume: str
    cover_letter: str
