from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from src.config import settings
from src.models import Resume, JobListing, JobFit

class Analyzer:
    """
    Wraps LLM calls for Resume Parsing and Job Matching.
    """
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.MODEL_NAME, 
            temperature=0.0,
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_BASE
        )

    def structured_resume(self, raw_text: str) -> Resume:
        """
        Extracts structured data from raw resume text.
        """
        parser = PydanticOutputParser(pydantic_object=Resume)
        prompt = ChatPromptTemplate.from_template(
            """
            Extract structured information from the following resume text.
            If a field is missing, leave it empty or use defaults.
            
            RESUME TEXT:
            {text}
            
            {format_instructions}
            """
        )
        chain = prompt | self.llm | parser
        return chain.invoke({
            "text": raw_text,
            "format_instructions": parser.get_format_instructions()
        })

    def analyze_fit(self, resume: Resume, job: JobListing) -> JobFit:
        """
        Analyzes the fit between a resume and a job description.
        """
        parser = PydanticOutputParser(pydantic_object=JobFit)
        prompt = ChatPromptTemplate.from_template(
            """
            Analyze the fit between the Candidate and the Job.
            Return a score from 0 to 100, reasoning, and missing skills.
            
            CANDIDATE:
            Skills: {skills}
            Experience: {experience}
            
            JOB:
            Title: {title}
            Description: {description}
            
            {format_instructions}
            """
        )
        chain = prompt | self.llm | parser
        return chain.invoke({
            "skills": ", ".join(resume.skills),
            "experience": "\n".join(resume.experience),
            "title": job.title,
            "description": job.description,
            "format_instructions": parser.get_format_instructions()
        })
