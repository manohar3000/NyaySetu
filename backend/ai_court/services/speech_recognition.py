import os
import tempfile
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException
from faster_whisper import WhisperModel
import asyncio

class SpeechRecognitionService:
    def __init__(self):
        # Load model only once when service starts
        self.model = None
        self.model_name = None
        
        # Try different model sizes in order of preference
        model_options = [
            ("base", "base"),  # Fastest, smallest
            ("small", "small"),  # Good balance
            ("medium", "medium"),  # Better accuracy
            ("large-v3", "large-v3")  # Best accuracy but slowest
        ]
        
        for model_name, model_id in model_options:
            try:
                print(f"🔄 Attempting to load Whisper model: {model_name}")
                self.model = WhisperModel(model_id, device="cpu", compute_type="int8")
                self.model_name = model_name
                print(f"✅ Whisper {model_name} model loaded successfully")
                break
            except Exception as e:
                print(f"❌ Failed to load {model_name} model: {e}")
                continue
        
        if not self.model:
            print("❌ All Whisper models failed to load. Speech recognition will not be available.")
    
    async def transcribe_audio(self, file: UploadFile) -> Dict[str, Any]:
        """
        Transcribe uploaded audio file to text.
        
        Args:
            file: Uploaded audio file
            
        Returns:
            Dictionary containing transcript and language info
        """
        if not self.model:
            raise HTTPException(status_code=500, detail="Speech recognition model not available")
        
        # Validate file type
        allowed_extensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm']
        file_extension = os.path.splitext(file.filename)[-1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save uploaded file to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            print(f"🎤 Starting transcription with {self.model_name} model...")
            
            # Adjust parameters based on model size
            if self.model_name in ["large-v3", "large"]:
                # Use more conservative settings for large models
                beam_size = 3
                best_of = 3
                temperature = 0.0
            elif self.model_name in ["medium"]:
                beam_size = 4
                best_of = 4
                temperature = 0.0
            else:
                # Use default settings for smaller models
                beam_size = 5
                best_of = 5
                temperature = 0.0
            
            # Transcribe audio with forced English language and improved settings
            segments, info = self.model.transcribe(
                tmp_path,
                language="en",  # Force English language
                task="transcribe",  # Explicitly set task
                beam_size=beam_size,
                best_of=best_of,
                temperature=temperature,  # Reduce randomness for more consistent results
                condition_on_previous_text=False,  # Don't condition on previous text
                initial_prompt="This is a legal courtroom conversation in English."  # Help guide the model
            )
            
            # Combine all segments into one transcript
            transcript = " ".join([segment.text for segment in segments]).strip()
            
            # Get language info
            language = info.language if hasattr(info, 'language') else "en"
            language_probability = info.language_probability if hasattr(info, 'language_probability') else 1.0
            
            print(f"📝 Transcription: {transcript}")
            print(f"🌍 Language: {language} (confidence: {language_probability:.2f})")
            
            # If transcript is empty or very short, try without language forcing
            if not transcript or len(transcript.strip()) < 2:
                print("🔄 Retrying without language forcing...")
                segments, info = self.model.transcribe(
                    tmp_path,
                    task="transcribe",
                    beam_size=beam_size,
                    best_of=best_of,
                    temperature=temperature
                )
                transcript = " ".join([segment.text for segment in segments]).strip()
                print(f"📝 Retry transcription: {transcript}")
            
            if not transcript:
                raise HTTPException(status_code=400, detail="No speech detected in the audio file")
            
            # Clean up transcript (remove extra spaces, normalize)
            transcript = " ".join(transcript.split())
            
            return {
                "transcript": transcript,
                "language": language,
                "language_confidence": language_probability,
                "model_used": self.model_name,
                "segments": [
                    {
                        "text": segment.text,
                        "start": segment.start,
                        "end": segment.end,
                        "words": [
                            {
                                "word": word.word,
                                "start": word.start,
                                "end": word.end,
                                "probability": word.probability
                            } for word in segment.words
                        ] if hasattr(segment, 'words') else []
                    } for segment in segments
                ]
            }
            
        except Exception as e:
            print(f"❌ Transcription failed: {e}")
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
            
        finally:
            # Clean up temporary file
            try:
                os.remove(tmp_path)
            except:
                pass

# Global speech recognition service instance
speech_recognition_service = SpeechRecognitionService() 