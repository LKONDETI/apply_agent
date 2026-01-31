import datetime
from typing import Optional
from sqlmodel import Field, Session, SQLModel, create_engine, select
from src.config import settings

# 1. Define the Table
class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: str = Field(index=True, unique=True) # Unique ID from the job source
    title: str
    company: str
    url: str
    status: str = Field(default="applied") # applied, interview, rejected
    applied_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    # Store the artifacts we generated
    resume_version_used: Optional[str] = None # Or store the full text
    cover_letter_generated: Optional[str] = None
    fit_score: int

# 2. Setup Engine
# connect_args={"check_same_thread": False} is needed for SQLite
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# 3. Operations
def get_application(job_id: str) -> Optional[Application]:
    with Session(engine) as session:
        statement = select(Application).where(Application.job_id == job_id)
        return session.exec(statement).first()

def create_application_record(
    job_id: str, 
    title: str, 
    company: str, 
    url: str, 
    fit_score: int,
    tailored_resume: str,
    cover_letter: str
):
    with Session(engine) as session:
        # Check duplicate again to be safe
        if get_application(job_id):
            return 
            
        app = Application(
            job_id=job_id,
            title=title,
            company=company,
            url=url,
            fit_score=fit_score,
            resume_version_used=tailored_resume,
            cover_letter_generated=cover_letter,
            status="applied"
        )
        session.add(app)
        session.commit()
        session.refresh(app)
        return app
