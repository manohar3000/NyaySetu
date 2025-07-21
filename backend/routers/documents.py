from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
import logging
from backend.document_summarizer import process_document, generate_document_summary, DocumentSummary
from backend.auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/summarize-text", response_model=DocumentSummary)
async def summarize_text_endpoint(
    text: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a summary of the provided text
    """
    try:
        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty"
            )
            
        summary = generate_document_summary(text)
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summarize_text_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

@router.post("/summarize-file", response_model=DocumentSummary)
async def summarize_file_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a document and generate a summary
    """
    try:
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        content = await file.read()
        
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {max_size/(1024*1024)}MB"
            )
            
        # Reset file pointer after reading
        await file.seek(0)
        
        # Process the document
        document_text = await process_document(file)
        
        # Generate summary
        summary = generate_document_summary(document_text)
        
        # Log the summary generation
        logger.info(f"Generated summary for file: {file.filename} (User: {current_user.get('email')})")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in summarize_file_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your document"
        )

@router.get("/history", response_model=List[dict])
async def get_summary_history(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's summary history (placeholder - implement database storage as needed)
    """
    try:
        # TODO: Implement database storage for history
        # For now, return an empty list
        return []
        
    except Exception as e:
        logger.error(f"Error retrieving summary history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving your history"
        )
