from fastapi import APIRouter, File, UploadFile, HTTPException
from faster_whisper import WhisperModel
import tempfile
import os

router = APIRouter()

# 🔁 Load model only once (when FastAPI starts)
model = WhisperModel("base", device="cpu", compute_type="int8")

@router.post("/transcribe")
def transcribe_audio(file: UploadFile = File(...)):
    # Save uploaded file to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[-1]) as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=5)
        transcript = " ".join([segment.text for segment in segments]).strip()
        language = info.get("language", "en-IN") if isinstance(info, dict) else getattr(info, "language", "en-IN")
        print("📝 Transcription:", transcript)

        if not transcript:
            raise HTTPException(status_code=400, detail="No transcription found.")

        return {"transcript": transcript, "language": language}
    finally:
        os.remove(tmp_path)
