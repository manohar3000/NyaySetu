from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
from backend.chat import chat_with_law_agent
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from backend.auth import (
    User, UserCreate, UserResponse, Token,
    get_db, get_password_hash, verify_password,
    create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)
from backend.routers import documents as documents_router
from backend.routers import appointments as appointments_router
import logging
import os

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    text: str

class ChatResponse(BaseModel):
    id: str
    text: str
    isUser: bool
    timestamp: datetime

@app.post("/api/signup", response_model=UserResponse)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"Signup attempt for email: {user.email}, username: {user.username}, role: {user.role}")
        
        # Check if email exists
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Check if username exists
        if db.query(User).filter(User.username == user.username).first():
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        # Create new user
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=get_password_hash(user.password),
            role=user.role,
            specialization=user.specialization if user.role == 'lawyer' else None,
            license_number=user.license_number if user.role == 'lawyer' else None,
            profile_image=user.profile_image if user.role == 'lawyer' else None
        )
        print(f"Created user object: {db_user.username}")
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"User saved successfully: {db_user.id}")
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Signup error details: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/api/signin", response_model=Token)
async def signin(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Find user by email or username
        user = db.query(User).filter((User.email == username) | (User.username == username)).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token with role and extra fields
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.username,
                "role": user.role,
                "specialization": user.specialization,
                "license_number": user.license_number,
                "profile_image": user.profile_image
            },
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "specialization": user.specialization,
            "license_number": user.license_number,
            "profile_image": user.profile_image
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signin error: {e}")  # Print error for debugging
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    try:
        if not message.text:
            raise HTTPException(status_code=400, detail="Message text cannot be empty")
            
        logger.info(f"Processing chat message: {message.text[:100]}...")  # Log only first 100 chars
        response_text = await chat_with_law_agent(message.text)
        
        if not response_text:
            raise HTTPException(status_code=500, detail="Received empty response from law agent")
            
        return ChatResponse(
            id=str(int(datetime.now().timestamp() * 1000)),
            text=response_text,
            isUser=False,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

# --- Include Routers ---
app.include_router(documents_router.router, prefix="/api")
app.include_router(appointments_router.router)

# --- AI Court Integration ---
from backend.ai_court.api.endpoints import router as ai_court_router
# Update the static files path to point to the correct location
ai_court_static_path = os.path.join(os.path.dirname(__file__), "ai_court", "static")
# Serve the main index.html at the root of the ai-court path
app.mount("/ai-court", StaticFiles(directory=ai_court_static_path, html=True), name="ai-court")
# Include the API endpoints
app.include_router(ai_court_router, prefix="/ai-court/api")

# Add AI Court interface endpoint
@app.get("/ai-court-interface")
async def ai_court_interface():
    """Serve the AI Court interface"""
    ai_court_html_path = os.path.join(os.path.dirname(__file__), "ai_court", "static", "index.html")
    return FileResponse(ai_court_html_path)

# --- End AI Court Integration ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
