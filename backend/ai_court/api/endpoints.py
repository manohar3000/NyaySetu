import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Depends
from typing import Optional, Dict, Any
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Deepgram API key from environment
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

from backend.ai_court.models.api_models import DebateInput, DebateTurnResponse, CaseDetails, PracticeConfig
from backend.ai_court.services.document_ingestion import ingest_document
from backend.ai_court.services.debate_orchestrator import (
    conduct_debate_turn, 
    handle_turn_based_debate,
    start_new_case as orchestrator_start_new_case
)
from backend.ai_court.services.voice_service import voice_service
from backend.ai_court.services.speech_recognition import speech_recognition_service
from backend.ai_court.core.state_manager import state_manager, DebateState

router = APIRouter()

# Turn-based debate models
class DebateTurnRequest(BaseModel):
    """Request model for submitting a turn in the debate"""
    session_id: str
    user_input: Optional[str] = None

class DebateStateResponse(BaseModel):
    """Response model for debate state"""
    session_id: str
    current_speaker: str
    waiting_for: str
    current_round: int
    debate_history: list[dict[str, Any]]
    last_updated: str

class NewDebateResponse(BaseModel):
    """Response model for new debate session"""
    session_id: str
    initial_state: dict[str, Any]

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

@router.post("/debate/start", response_model=NewDebateResponse, summary="Start a new turn-based debate session")
async def start_debate(case_details: CaseDetails, practice_config: Dict[str, Any]):
    """
    Start a new turn-based debate session with the given case details and practice configuration.
    Returns a session ID that should be used for subsequent turns.
    """
    try:
        # Start a new case in the orchestrator
        response = await orchestrator_start_new_case(case_details, practice_config)
        
        # Create a new debate state
        state = DebateState(
            session_id=response.session_id,
            case_type=case_details.case_type,
            specific_issue=case_details.issue,
            case_summary=case_details.summary,
            user_role=case_details.user_role,
            judge_persona="an experienced High Court Judge with 20+ years of experience",
            ai_lawyer_persona="a seasoned defense attorney with 15+ years of experience"
        )
        
        # Save the initial state
        state_manager.sessions[response.session_id] = state
        
        # Generate the judge's opening statement
        judge_response = await handle_turn_based_debate(response.session_id)
        
        return {
            "session_id": response.session_id,
            "initial_state": {
                "judge_opening": judge_response["content"],
                "waiting_for": "user",
                "current_round": 1
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start debate: {str(e)}")


@router.post("/debate/turn", response_model=Dict[str, Any], summary="Submit a turn in the debate")
async def submit_turn(turn_request: DebateTurnRequest):
    """
    Submit a turn in the turn-based debate system.
    If it's the user's turn, provide user_input.
    The system will automatically handle AI lawyer and judge responses.
    """
    try:
        # Process the turn and get the response
        response = await handle_turn_based_debate(
            session_id=turn_request.session_id,
            user_input=turn_request.user_input
        )
        
        # Get the updated state
        if turn_request.session_id in state_manager.sessions:
            state = state_manager.sessions[turn_request.session_id]
            response.update({
                "waiting_for": state.waiting_for,
                "current_round": state.current_round,
                "is_final_judgment": (state.current_round >= state.max_rounds)
            })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing turn: {str(e)}")


@router.get("/debate/state/{session_id}", response_model=DebateStateResponse, summary="Get the current state of a debate")
async def get_debate_state(session_id: str):
    """Get the current state of a debate session"""
    if session_id not in state_manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    state = state_manager.sessions[session_id]
    return {
        "session_id": session_id,
        "current_speaker": state.current_speaker,
        "waiting_for": state.waiting_for,
        "current_round": state.current_round,
        "debate_history": state.debate_history,
        "last_updated": state.last_updated.isoformat()
    }


@router.post("/debate_turn", response_model=DebateTurnResponse, summary="[Legacy] Conduct a single turn of the legal debate")
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
        if not DEEPGRAM_API_KEY and not speech_recognition_service.whisper_model:
            raise HTTPException(
                status_code=503, 
                detail="Speech recognition service is not available. No API key or fallback model found."
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
            "available": bool(DEEPGRAM_API_KEY or speech_recognition_service.whisper_model),
            "model_name": "Deepgram" if DEEPGRAM_API_KEY else (
                speech_recognition_service.whisper_model_name if speech_recognition_service.whisper_model else None
            ),
            "service_ready": True,
            "using_deepgram": bool(DEEPGRAM_API_KEY),
            "using_whisper": bool(speech_recognition_service.whisper_model)
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
