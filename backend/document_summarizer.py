import os
import logging
from typing import Optional
import google.generativeai as genai
from fastapi import HTTPException, UploadFile
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY= "AIzaSyDFn9PgAJi9vyCPEAMMM45QpMG9DTm-uE0"
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    model_vision = genai.GenerativeModel('gemini-pro-vision')
except Exception as e:
    logger.error(f"Error initializing Gemini API: {str(e)}")
    raise

class DocumentSummary(BaseModel):
    content: str
    summary: str
    key_points: list[str]
    timestamp: str

def summarize_text(text: str, max_length: int = 1000) -> dict:
    """
    Generate a summary and key points from the given text using Gemini API
    """
    try:
        prompt = f"""
        Please provide a concise summary of the following text in under {max_length} characters.
        Also, extract 3-5 key points as a bulleted list.
        
        Text to summarize:
        {text}
        
        Summary and key points:"""
        
        response = model.generate_content(prompt)
        result = response.text.strip().split("\n\n", 1)
        
        if len(result) == 2:
            summary = result[0]
            key_points = [point.strip("- ") for point in result[1].split("\n") if point.strip()]
        else:
            summary = response.text[:max_length]
            key_points = []
        
        return {
            "summary": summary,
            "key_points": key_points,
            "original_length": len(text),
            "summary_length": len(summary)
        }
        
    except Exception as e:
        logger.error(f"Error in text summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

async def process_document(file: UploadFile) -> str:
    """
    Process uploaded document and extract text
    """
    try:
        # Check file type
        content_type = file.content_type
        if not content_type:
            raise HTTPException(status_code=400, detail="Could not determine file type")
            
        # Read file content
        content = await file.read()
        
        # Process based on file type
        if 'pdf' in content_type:
            return await _extract_text_from_pdf(content)
        elif 'text/plain' in content_type:
            return content.decode('utf-8')
        # Add more file type handlers as needed (docx, etc.)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
            
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

async def _extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF content"""
    try:
        from PyPDF2 import PdfReader
        from io import BytesIO
        
        pdf_file = BytesIO(content)
        reader = PdfReader(pdf_file)
        text = ""
        
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        return text.strip()
        
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

def generate_document_summary(document_text: str) -> DocumentSummary:
    """
    Generate a comprehensive document summary with key points
    """
    try:
        summary_result = summarize_text(document_text)
        
        return DocumentSummary(
            content=document_text[:1000] + ("..." if len(document_text) > 1000 else ""),
            summary=summary_result["summary"],
            key_points=summary_result["key_points"],
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in document summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating document summary: {str(e)}")
