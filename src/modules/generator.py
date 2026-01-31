from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.config import settings
from src.models import Resume, JobListing

class Generator:
    """
    Generates tailored content (Resumes, Cover Letters) using LLMs.
    """
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.MODEL_NAME,
            temperature=0.7, # Slightly higher creativity for writing
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_BASE
        )

    def tailor_resume(self, resume: Resume, job: JobListing) -> str:
        """
        Rewrites valid parts of the resume to better highlight fit for the job.
        Returns a markdown or plain text version of the tailored resume.
        """
        prompt = ChatPromptTemplate.from_template(
            """
            You are an expert career coach. Tailor the candidate's resume to specifically highlight why they are a great fit for this specific job.
            Do NOT lie or invent experiences. Only emphasize relevant existing skills and experiences.
            
            ORIGINAL RESUME:
            {resume_text}
            
            TARGET JOB:
            {job_description}
            
            Output the full tailored resume in Markdown format.
            """
        )
        chain = prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "resume_text": resume.raw_text,
            "job_description": f"{job.title} at {job.company}\n{job.description}"
        })

    def generate_cover_letter(self, resume: Resume, job: JobListing) -> str:
        """
        Generates a personalized cover letter.
        """
        prompt = ChatPromptTemplate.from_template(
            """
            Write a professional and compelling cover letter for the following candidate applying to the specified job.
            
            CANDIDATE DETAILS:
            Name: {name}
            Key Skills: {skills}
            
            JOB DETAILS:
            Title: {title}
            Company: {company}
            Description: {description}
            
            The cover letter should be concise (under 300 words), enthusiastic, and professional.
            """
        )
        chain = prompt | self.llm | StrOutputParser()
        return chain.invoke({
            "name": resume.full_name or "Candidate",
            "skills": ", ".join(resume.skills),
            "title": job.title,
            "company": job.company,
            "description": job.description
        })
