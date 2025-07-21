from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from typing import Optional
from pydantic import BaseModel

from backend.ai_court.models.api_models import DebateInput, DebateTurnResponse
from backend.ai_court.services.document_ingestion import ingest_document
from backend.ai_court.services.debate_orchestrator import conduct_debate_turn
from backend.ai_court.services.voice_service import voice_service
from backend.ai_court.services.speech_recognition import speech_recognition_service

router = APIRouter()

# Voice-related models
class VoiceRequest(BaseModel):
    text: str
    role: str = "lawyer"  # "judge", "lawyer", "welcome"
    language: str = "en"

class VoiceResponse(BaseModel):
    audio_url: str
    text: str
    role: str
    language: str

@router.post("/upload_case_materials", summary="Upload and index legal case materials")
async def upload_case_materials_endpoint(
    file: UploadFile = File(..., description="The legal document file (PDF or TXT)."),
    # Optional: Allow manual metadata input for new documents
    case_name: Optional[str] = None,
    judgement_date: Optional[str] = None,
    court: Optional[str] = None,
    tags: Optional[str] = None # Comma-separated tags
):
    """
    Uploads a legal document, processes it for indexing, and adds it to the
    case law vector store. Metadata can be optionally provided or will be
    extracted/managed by the ingestion service.
    """
    try:
        # Pass optional metadata to the ingestion service
        result = await ingest_document(file)
        return result
    except HTTPException as e:
        raise e # Re-raise FastAPI HTTPExceptions directly
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during upload: {str(e)}")

@router.post("/debate_turn", response_model=DebateTurnResponse, summary="Conduct a single turn of the legal debate")
async def debate_turn_endpoint(input: DebateInput):
    """
    Processes a single turn in the legal debate. It takes the human lawyer's input
    and the ongoing debate history, then generates an AI lawyer's response and
    the judge's intervention (if necessary), along with relevant sources.
    """
    try:
        response = await conduct_debate_turn(input)
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during debate turn: {str(e)}")

@router.post("/synthesize_speech", response_model=VoiceResponse, summary="Convert text to speech")
async def synthesize_speech_endpoint(request: VoiceRequest):
    """
    Converts text to speech using different voices for different roles.
    Supports judge, lawyer, and welcome voices.
    """
    try:
        audio_url = await voice_service.synthesize_speech(
            text=request.text,
            role=request.role,
            lang=request.language
        )
        
        if not audio_url:
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        return VoiceResponse(
            audio_url=audio_url,
            text=request.text,
            role=request.role,
            language=request.language
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")

@router.post("/transcribe_audio", summary="Convert speech to text")
async def transcribe_audio_endpoint(file: UploadFile = File(..., description="Audio file to transcribe")):
    """
    Transcribes uploaded audio file to text using speech recognition.
    Supports multiple audio formats.
    """
    try:
        print(f"🎤 Received audio file: {file.filename} ({file.content_type})")
        
        # Check if speech recognition service is available
        if not speech_recognition_service.model:
            raise HTTPException(
                status_code=503, 
                detail="Speech recognition service is not available. Please try again later."
            )
        
        result = await speech_recognition_service.transcribe_audio(file)
        print(f"✅ Transcription completed successfully")
        return result
        
    except HTTPException as e:
        print(f"❌ HTTP Exception in transcription: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ Unexpected error in transcription: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/speech_status", summary="Check speech recognition service status")
async def speech_status_endpoint():
    """
    Check if the speech recognition service is available and working.
    """
    try:
        status = {
            "available": speech_recognition_service.model is not None,
            "model_name": speech_recognition_service.model_name if speech_recognition_service.model else None,
            "service_ready": True
        }
        return status
    except Exception as e:
        return {
            "available": False,
            "model_name": None,
            "service_ready": False,
            "error": str(e)
        }

@router.post("/debate_turn_with_voice", response_model=DebateTurnResponse, summary="Conduct debate turn with voice synthesis")
async def debate_turn_with_voice_endpoint(input: DebateInput):
    """
    Processes a debate turn and automatically generates voice for AI responses.
    Returns both text and audio URLs for AI lawyer and judge responses.
    """
    try:
        # Conduct the debate turn
        response = await conduct_debate_turn(input)
        
        # Generate voice for AI lawyer response
        if response.ai_lawyer_response:
            lawyer_audio_url = await voice_service.synthesize_speech(
                text=response.ai_lawyer_response,
                role="lawyer"
            )
            response.ai_lawyer_audio_url = lawyer_audio_url
        
        # Generate voice for judge intervention
        if response.judge_intervention and response.judge_intervention != "NO_JUDGE_INTERVENTION":
            judge_audio_url = await voice_service.synthesize_speech(
                text=response.judge_intervention,
                role="judge"
            )
            response.judge_audio_url = judge_audio_url
        
        return response
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debate turn with voice failed: {str(e)}")
