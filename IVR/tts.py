import os
from elevenlabs import play, save
from elevenlabs.client import ElevenLabs
from gtts import gTTS
from utils import retry
import uuid

client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)
AUDIO_DIR = "audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

@retry
def elevenlabs_tts(text, lang="en"):
    audio = client.generate(
        text=text,
        voice="Rachel",
        model="eleven_multilingual_v2"
    )
    filename = f"output_{uuid.uuid4()}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    save(audio, filepath)
    return filename

@retry
def gtts_fallback(text, lang):
    # Map language codes for gTTS compatibility
    lang = lang.lower()
    if lang in ["hi-in", "hi"]:
        gtts_lang = "hi"
    elif lang in ["en-in", "en"]:
        gtts_lang = "en"
    else:
        gtts_lang = "en"  # Default fallback
    tts = gTTS(text=text, lang=gtts_lang)
    filename = f"output_{uuid.uuid4()}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    tts.save(filepath)
    return filename

def save_to_local(filename):
    # Returns the public URL for the audio file
    return f"/audio/{filename}"

def synthesize_speech(text, lang="en"):
    try:
        filename = elevenlabs_tts(text, lang)
    except Exception:
        filename = gtts_fallback(text, lang)
    url = save_to_local(filename)
    return url 