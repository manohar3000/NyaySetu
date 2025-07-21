import google.generativeai as genai
import os
from dotenv import load_dotenv
from backend.ai_court.core.config import settings

# Load environment variables at the very beginning
load_dotenv()

def get_gemini_model():
    """Initializes and returns the Gemini GenerativeModel."""
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable not set.")
    
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
        print(f"Gemini model '{settings.GEMINI_MODEL_NAME}' initialized successfully.")
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Gemini model: {e}. Please check GOOGLE_API_KEY.")

gemini_model = get_gemini_model()
