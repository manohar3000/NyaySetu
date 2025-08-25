import os
import tempfile
import asyncio
import aiohttp
from typing import Dict, Any, Tuple, List, Optional
from fastapi import UploadFile, HTTPException, status
from faster_whisper import WhisperModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
DEEPGRAM_API_KEY = "27cae19012898c181b19b61be3a4f90362c1dde6"
DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen?model=nova-2"  # Using Nova-2 as it's the fastest model

class SpeechRecognitionService:
    def __init__(self):
        # Initialize Whisper as fallback
        self.whisper_model = None
        self.whisper_model_name = None
        self._init_whisper_fallback()

    def _init_whisper_fallback(self):
        """Initialize Whisper model as fallback"""
        # Try different model sizes in order of preference
        model_options = [
            ("base", "base"),  # Fastest, smallest
            ("small", "small"),  # Good balance
            ("medium", "medium"),  # Better accuracy
        ]

        for model_name, model_id in model_options:
            try:
                print(f"🔄 Attempting to load Whisper fallback model: {model_name}")
                self.whisper_model = WhisperModel(model_id, device="cpu", compute_type="int8")
                self.whisper_model_name = model_name
                print(f"✅ Whisper {model_name} fallback model loaded successfully")
                break
            except Exception as e:
                print(f"❌ Failed to load Whisper {model_name} model: {e}")

        if not self.whisper_model:
            print("⚠️ Warning: No Whisper model could be loaded. Speech recognition will fail if Deepgram is unavailable.")

    async def _transcribe_with_deepgram(self, audio_data: bytes) -> Tuple[bool, str]:
        """Transcribe audio using Deepgram API"""
        if not DEEPGRAM_API_KEY:
            print("⚠️ Deepgram API key not found. Falling back to Whisper.")
            return False, ""

        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/wav"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    DEEPGRAM_API_URL,
                    headers=headers,
                    data=audio_data,
                    timeout=30  # 30 seconds timeout
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return True, result['results']['channels'][0]['alternatives'][0]['transcript']
                    else:
                        error = await response.text()
                        print(f"❌ Deepgram API error: {error}")
                        return False, ""
        except Exception as e:
            print(f"❌ Deepgram API request failed: {str(e)}")
            return False, ""

    async def _transcribe_with_whisper(self, audio_data: bytes) -> Dict[str, Any]:
        """Transcribe audio using Whisper (fallback)"""
        if not self.whisper_model:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No speech recognition service is available"
            )
        
        # Save audio data to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            try:
                temp_audio.write(audio_data)
                temp_audio_path = temp_audio.name
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error processing audio data: {str(e)}"
                )
        
        try:
            # Transcribe the audio file using Whisper
            segments, info = await asyncio.to_thread(
                self.whisper_model.transcribe,
                temp_audio_path,
                beam_size=5,
                language="en"
            )
            
            # Convert segments to text
            transcript = " ".join([segment.text for segment in segments]).strip()
            
            return {
                "text": transcript,
                "language": info.language if hasattr(info, 'language') else 'en',
                "model": f"whisper-{self.whisper_model_name}",
                "service": "whisper",
                "duration": sum(segment.duration for segment in segments) if segments else 0
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error during speech recognition: {str(e)}"
            )
            
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_audio_path)
            except:
                pass

    async def transcribe_audio(self, audio_file: UploadFile) -> Dict[str, Any]:
        """
        Transcribe audio file to text using Deepgram (primary) or Whisper (fallback).

        Args:
            audio_file: UploadFile containing audio data

        Returns:
            Dict containing transcription results and metadata
        """
        # Read audio data
        try:
            audio_data = await audio_file.read()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading audio file: {str(e)}"
            )
        
        # Try Deepgram first
        success, transcription = await self._transcribe_with_deepgram(audio_data)
        if success:
            return {
                "text": transcription.strip(),
                "model": "deepgram-nova-2",
                "service": "deepgram"
            }
        
        # Fall back to Whisper if Deepgram fails
        print("⚠️ Falling back to Whisper for speech recognition")
        return await self._transcribe_with_whisper(audio_data)

# Global speech recognition service instance
speech_recognition_service = SpeechRecognitionService() 