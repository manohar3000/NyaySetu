import os
import uuid
import time
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

from gtts import gTTS
from elevenlabs.client import ElevenLabs
from elevenlabs import play  # Optional: if you want to play audio

load_dotenv()

VOICE_CONFIG = {
    "judge":   {"voice_name": "Brian",  "gtts_lang": "en"},
    "lawyer":  {"voice_name": "Callum", "gtts_lang": "en"},
    "welcome": {"voice_name": "Alice",  "gtts_lang": "en"},
}

class VoiceService:
    def __init__(self):
        self.audio_dir = Path("backend/ai_court/static/audio")
        self.audio_dir.mkdir(parents=True, exist_ok=True)

        api_key = os.getenv("ELEVENLABS_API_KEY")
        if api_key:
            try:
                self.client = ElevenLabs(api_key=api_key)
                print("✅ ElevenLabs client initialized")
            except Exception as e:
                print(f"⚠️ Could not initialize ElevenLabs client: {e}")
                self.client = None
        else:
            print("⚠️ ELEVENLABS_API_KEY is missing; using gTTS only")
            self.client = None

    async def synthesize_speech(self, text: str, role: str = "lawyer", lang: str = "en") -> Optional[str]:
        if not text.strip():
            return None

        if self.client:
            fn = await self._elevenlabs_tts(text, role)
            if fn:
                return f"/static/audio/{fn}"

        fn = await self._gtts_fallback(text, role, lang)
        return f"/static/audio/{fn}"

    async def _elevenlabs_tts(self, text: str, role: str) -> Optional[str]:
        cfg = VOICE_CONFIG.get(role, VOICE_CONFIG["lawyer"])
        voice_name = cfg["voice_name"]

        try:
            audio = self.client.text_to_speech.convert(
                text=text,
                voice_id=voice_name,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )

            filename = f"{role}_{uuid.uuid4()}.mp3"
            filepath = self.audio_dir / filename
            with open(filepath, "wb") as f:
                f.write(audio)

            print(f"✅ ElevenLabs TTS generated: {filename}")
            return filename
        except Exception as e:
            print(f"❌ ElevenLabs TTS failed: {e}")
            return None

    async def _gtts_fallback(self, text: str, role: str, lang: str) -> str:
        gtts_lang = VOICE_CONFIG.get(role, VOICE_CONFIG["lawyer"])["gtts_lang"]
        filename = f"{role}_{uuid.uuid4()}.mp3"
        filepath = self.audio_dir / filename
        try:
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            tts.save(str(filepath))
            print(f"✅ gTTS fallback generated: {filename}")
        except Exception as e:
            print(f"❌ gTTS fallback failed: {e}")
        return filename

    async def cleanup_old_files(self, max_age_hours: int = 24):
        cutoff = time.time() - max_age_hours * 3600
        for f in self.audio_dir.glob("*.mp3"):
            if f.stat().st_mtime < cutoff:
                try:
                    f.unlink()
                    print(f"🗑️ Deleted old file: {f.name}")
                except Exception as e:
                    print(f"⚠️ Failed to delete {f.name}: {e}")

voice_service = VoiceService()
