import os
import uuid
import time
from typing import Optional
from gtts import gTTS
from pathlib import Path
from elevenlabs import generate, save

# Voice configuration
VOICE_CONFIG = {
    "judge": {
        "voice_name": "Brian",
        "gtts_lang": "en",
        "rate": 0.9,
        "pitch": 0.8
    },
    "lawyer": {
        "voice_name": "Callum",
        "gtts_lang": "en",
        "rate": 1.0,
        "pitch": 1.0
    },
    "welcome": {
        "voice_name": "Alice",
        "gtts_lang": "en",
        "rate": 0.9,
        "pitch": 0.9
    }
}

class VoiceService:
    def __init__(self):
        # Use the correct path relative to the backend directory
        self.audio_dir = Path("backend/ai_court/static/audio")
        self.audio_dir.mkdir(parents=True, exist_ok=True)

        # Initialize ElevenLabs API key if available
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if api_key:
            try:
                self.api_key = api_key
                print("✅ ElevenLabs API key loaded successfully")
            except Exception as e:
                print(f"⚠️ Failed to load ElevenLabs API key: {e}")
                self.api_key = None
        else:
            print("⚠️ ELEVENLABS_API_KEY not found, using gTTS fallback only")
            self.api_key = None

    async def synthesize_speech(self, text: str, role: str = "lawyer", lang: str = "en") -> Optional[str]:
        """
        Synthesize speech for the given text and role.
        
        Args:
            text: Text to convert to speech
            role: Role of the speaker ("judge", "lawyer", "welcome")
            lang: Language code
            
        Returns:
            URL path to the generated audio file or None if failed
        """
        if not text.strip():
            return None

        try:
            # Try ElevenLabs first
            if self.api_key:
                filename = await self._elevenlabs_tts(text, role, lang)
                if filename:
                    return f"/static/audio/{filename}"

            # Fallback to gTTS
            filename = await self._gtts_fallback(text, role, lang)
            return f"/static/audio/{filename}"

        except Exception as e:
            print(f"❌ Speech synthesis failed: {e}")
            return None

    async def _elevenlabs_tts(self, text: str, role: str, lang: str) -> Optional[str]:
        """Generate speech using ElevenLabs API"""
        try:
            voice_config = VOICE_CONFIG.get(role, VOICE_CONFIG["lawyer"])
            voice_name = voice_config["voice_name"]

            # Use the generate function directly with API key
            audio = generate(
                text=text,
                voice=voice_name,
                model="eleven_multilingual_v2",
                api_key=self.api_key
            )

            filename = f"{role}_{uuid.uuid4()}.mp3"
            filepath = self.audio_dir / filename

            # Save audio file
            save(audio, str(filepath))
            print(f"✅ ElevenLabs TTS generated: {filename}")
            return filename

        except Exception as e:
            print(f"❌ ElevenLabs TTS failed: {e}")
            return None

    async def _gtts_fallback(self, text: str, role: str, lang: str) -> str:
        """Generate speech using gTTS as fallback"""
        try:
            voice_config = VOICE_CONFIG.get(role, VOICE_CONFIG["lawyer"])
            
            # Map language codes for gTTS compatibility
            lang = lang.lower()
            if lang in ["hi-in", "hi"]:
                gtts_lang = "hi"
            elif lang in ["en-in", "en"]:
                gtts_lang = "en"
            else:
                gtts_lang = "en"  # Default fallback

            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            filename = f"{role}_{uuid.uuid4()}.mp3"
            filepath = self.audio_dir / filename

            tts.save(str(filepath))
            print(f"✅ gTTS fallback generated: {filename}")
            return filename

        except Exception as e:
            print(f"❌ gTTS fallback failed: {e}")
            # Return a placeholder filename
            return f"{role}_{uuid.uuid4()}.mp3"

    async def cleanup_old_files(self, max_age_hours: int = 24):
        """Clean up old audio files to save disk space"""
        try:
            import time
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600

            for file_path in self.audio_dir.glob("*.mp3"):
                if current_time - file_path.stat().st_mtime > max_age_seconds:
                    try:
                        file_path.unlink()
                        print(f"🗑️ Cleaned up old audio file: {file_path.name}")
                    except Exception as e:
                        print(f"⚠️ Couldn't delete {file_path.name}: {e}")

        except Exception as e:
            print(f"⚠️ Cleanup failed: {e}")

# Global voice service instance
voice_service = VoiceService()
