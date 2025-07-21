import os
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional

# Load environment variables at the very beginning
load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "LegalDebateAPI"
    PORT: int = 8000
    CORS_ORIGINS: str = Field(default="*", env="CORS_ORIGINS")  # Consider restricting in production
    UPLOADS_DIR: str = "uploads"

    QDRANT_URL: str = "https://b3652dfa-d7f8-4c59-955f-5a4e3a120f2a.europe-west3-0.gcp.cloud.qdrant.io"
    QDRANT_API_KEY: Optional[str] = Field(default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.QPy61fUmmz_SF_JjvlAD7vQ8BfNeU2zFyziTKYY-keQ", env="QDRANT_API_KEY")  # Hardcoded for development

    GOOGLE_API_KEY: Optional[str] = Field(default="AIzaSyDFn9PgAJi9vyCPEAMMM45QpMG9DTm-uE0", env="GOOGLE_API_KEY")  # Hardcoded for development
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"
    
    # ElevenLabs API Key for voice synthesis
    ELEVENLABS_API_KEY: str = Field(default="", env="ELEVENLABS_API_KEY")
    
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-large-en-v1.5"
    
    QDRANT_QNA_COLLECTION: str = "legal_qna_bge_large"
    QDRANT_CASE_COLLECTION: str = "Judge_Lawyer_Case_Large"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
