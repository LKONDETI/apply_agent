import os
from pathlib import Path
from typing import Optional
import pdfplumber
import docx2txt

class ResumeParser:
    """
    Handles extracting text from PDF and DOCX files.
    """
    
    @staticmethod
    def parse_file(file_path: str) -> str:
        """
        Detects file type and extracts text.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        extension = path.suffix.lower()
        
        if extension == ".pdf":
            return ResumeParser._parse_pdf(file_path)
        elif extension == ".docx":
            return ResumeParser._parse_docx(file_path)
        elif extension == ".txt":
            return path.read_text(encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file format: {extension}")

    @staticmethod
    def _parse_pdf(file_path: str) -> str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    @staticmethod
    def _parse_docx(file_path: str) -> str:
        return docx2txt.process(file_path).strip()

if __name__ == "__main__":
    # Simple test
    print("ResumeParser module loaded.")
