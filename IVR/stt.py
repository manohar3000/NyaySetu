from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import Optional
import os
import asyncio
from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions,
    FileSource,
)
import tempfile
from dotenv import load_dotenv

router = APIRouter()
load_dotenv()

# Initialize Deepgram client with API key
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    raise ValueError("DEEPGRAM_API_KEY environment variable not set")

def get_deepgram_client():
    """Get a Deepgram client instance."""
    return DeepgramClient(api_key=DEEPGRAM_API_KEY)

async def detect_language(deepgram, audio_data: bytes) -> str:
    """Detect the language of the audio using Deepgram's language detection.
    
    Args:
        deepgram: Deepgram client instance
        audio_data: Audio data in bytes
        
    Returns:
        str: Detected language code (e.g., 'en-IN', 'hi-IN')
    """
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(audio_data)
            tmp.flush()
            
            with open(tmp.name, "rb") as audio_file:
                payload = {"buffer": audio_file}
                
                # First, detect the language
                detect_options = {
                    "detect_language": True,
                    "language": "en-IN,hi-IN",  # Only consider English and Hindi
                    "tier": "enhanced"
                }
                
                response = await deepgram.transcription.prerecorded.v("1")\
                    .source(payload)\
                    .query(detect_options)
                
                # Get detected language or default to English
                if "results" in response and "channels" in response["results"]:
                    channel = response["results"]["channels"][0]
                    if "detected_language" in channel:
                        return channel["detected_language"]
        
        return "en-IN"  # Default to English if detection fails
        
    except Exception as e:
        print(f"Error in language detection: {str(e)}")
        return "en-IN"  # Default to English on error

async def transcribe_with_deepgram(file_path: str, language: str = None) -> dict:
    """Transcribe audio file using Deepgram API with support for multiple languages.
    
    Args:
        file_path: Path to the audio file
        language: Optional language code (e.g., 'en-IN', 'hi-IN'). 
                 If None, will auto-detect between English and Hindi.
        
    Returns:
        dict: Contains 'transcript' (str) and 'language' (str) detected
    """
    try:
        deepgram = get_deepgram_client()
        
        with open(file_path, "rb") as audio_file:
            audio_data = audio_file.read()
            
            # If no language specified, detect it
            if not language:
                language = await detect_language(deepgram, audio_data)
                print(f"🔍 Detected language: {language}")
            
            # Now transcribe with the detected/specified language
            with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
                tmp.write(audio_data)
                tmp.flush()
                
                with open(tmp.name, "rb") as audio_file:
                    payload = {"buffer": audio_file}
                    
                    transcribe_options = {
                        "model": "nova-2",
                        "language": language,
                        "smart_format": True,
                        "punctuate": True,
                        "utterances": True,
                        "diarize": False,
                        "tier": "enhanced",
                        "profanity_filter": False
                    }
                    
                    response = await deepgram.transcription.prerecorded.v("1")\
                        .source(payload)\
                        .query(transcribe_options)
                    
                    transcript = ""
                    if "results" in response and "channels" in response["results"]:
                        channel = response["results"]["channels"][0]
                        if "alternatives" in channel and len(channel["alternatives"]) > 0:
                            transcript = channel["alternatives"][0]["transcript"].strip()
                    
                    return {
                        "transcript": transcript,
                        "language": language
                    }
        
    except Exception as e:
        print(f"Error in Deepgram transcription: {str(e)}")
        raise

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = None  # Optional: 'en-IN' for English, 'hi-IN' for Hindi, or None for auto-detect
):
    """Transcribe audio file using Deepgram API with support for multiple languages.
    
    Args:
        file: Uploaded audio file
        language: Optional language code ('en-IN' for English, 'hi-IN' for Hindi).
                 If not provided, will auto-detect between English and Hindi.
        
    Returns:
        dict: Contains 'transcript' (str) and 'language' (str) detected
    """
    # Validate language parameter if provided
    if language and language not in ["en-IN", "hi-IN"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid language parameter. Use 'en-IN' for English or 'hi-IN' for Hindi."
        )
    
    # Save uploaded file to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[-1]) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Transcribe the audio file with language detection if not specified
        result = await transcribe_with_deepgram(tmp_path, language)
        print(f"\U0001F4DD Transcription ({result['language']}):", result['transcript'])

        if not result['transcript']:
            raise HTTPException(status_code=400, detail="No transcription found.")

        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
