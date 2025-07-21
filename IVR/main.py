from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from ivr_router import router as ivr_router
from fallback import router as fallback_router
from config import load_config
from stt import router as stt_router
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Lexa AI IVR Legal Assistant")

config = load_config()

app.include_router(ivr_router, prefix="/ivr")
app.include_router(fallback_router, prefix="/fallback")
app.include_router(stt_router, prefix="/ivr")
app.mount("/audio", StaticFiles(directory="audio"), name="audio")

@app.get("/")
def root():
    return {"message": "Lexa AI IVR backend is running."} 