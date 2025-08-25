from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, validator
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
from backend.routers import portia_chat as portia_chat_router
from backend.routers import portia_admin_rag as portia_rag_router
from backend.routers import portia_appointments as portia_appointments_router
from backend.routers import portia_evidence as portia_evidence_router
from backend.routers import portia_compliance as portia_compliance_router
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
    message: str  # Standardized on 'message' field
    
    def get_text(self) -> str:
        """Get the message text."""
        return self.message

class ChatResponse(BaseModel):
    id: str
    text: str
    isUser: bool
    timestamp: datetime

@app.post("/api/signup", response_model=UserResponse, include_in_schema=False)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Legacy signup endpoint. Use /api/auth/register instead."""
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

# New auth endpoints that match frontend expectations
@app.post("/api/auth/register", response_model=UserResponse)
async def register(
    request: Request,
    email: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    role: Optional[str] = Form('user'),
    specialization: Optional[str] = Form(None),
    license_number: Optional[str] = Form(None),
    profile_image: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Register a new user. Handles both JSON and form data."""
    content_type = request.headers.get('content-type')
    
    print(f"Register request received. Content-Type: {content_type}")
    
    try:
        if content_type == 'application/json':
            try:
                json_data = await request.json()
                print(f"JSON data received: {json_data}")
                user = UserCreate(**json_data)
            except Exception as e:
                print(f"Error parsing JSON data: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid JSON data: {str(e)}")
        else:
            print(f"Form data received - email: {email}, username: {username}, role: {role}")
            if not all([email, username, password]):
                error_msg = f"Missing required fields. Email: {'present' if email else 'missing'}, " \
                          f"Username: {'present' if username else 'missing'}, " \
                          f"Password: {'present' if password else 'missing'}"
                print(f"Validation error: {error_msg}")
                raise HTTPException(status_code=400, detail=error_msg)
            
            try:
                user = UserCreate(
                    email=email,
                    username=username,
                    password=password,
                    role=role,
                    specialization=specialization,
                    license_number=license_number,
                    profile_image=profile_image
                )
                print("UserCreate object created successfully")
            except Exception as e:
                print(f"Error creating UserCreate object: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid user data: {str(e)}")
        
        # Log the registration attempt with user details (excluding password)
        print(f"Registration attempt for email: {user.email}, username: {user.username}, role: {user.role}")
        
        # Try to register the user
        try:
            # First check if email or username already exists
            existing_user = db.query(User).filter(
                (User.email == user.email) | (User.username == user.username)
            ).first()
            
            if existing_user:
                if existing_user.email == user.email:
                    raise HTTPException(
                        status_code=400,
                        detail="This email is already registered. Please use a different email or try logging in."
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="This username is already taken. Please choose a different username."
                    )
                    
            result = await signup(user, db)
            print("Registration successful")
            return result
        except HTTPException as he:
            print(f"Registration failed with status {he.status_code}: {he.detail}")
            raise
        except Exception as e:
            print(f"Unexpected error during registration: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
            
    except Exception as e:
        print(f"Unexpected error in register endpoint: {str(e)}")
        raise

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str
    
    @validator('username', always=True)
    def check_username_or_email(cls, v, values):
        if not v and 'email' in values and not values['email']:
            raise ValueError('Either username or email must be provided')
        return v

@app.post("/api/auth/login", response_model=Token)
async def login(
    request: Request,
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Login endpoint that handles both JSON and form data."""
    content_type = request.headers.get('content-type', '').lower()
    
    try:
        if content_type == 'application/json':
            try:
                json_data = await request.json()
                print(f"Login JSON data received: {json_data}")
                login_data = LoginRequest(**json_data)
                username = login_data.username or login_data.email
                password = login_data.password
            except Exception as e:
                print(f"Error parsing login JSON: {str(e)}")
                raise HTTPException(status_code=422, detail=f"Invalid login data: {str(e)}")
        else:
            # Handle form data
            form_data = await request.form()
            print(f"Login form data received: {dict(form_data)}")
            username = form_data.get('username') or form_data.get('email')
            password = form_data.get('password')
            
        if not username or not password:
            raise HTTPException(
                status_code=422, 
                detail="Both username and password are required"
            )
            
        print(f"Login attempt for username: {username}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in login endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during login")
    
    return await signin(username, password, db)

# Legacy endpoints (kept for backward compatibility)
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

async def handle_chat_message(request: Request):
    """
    Handle incoming chat messages from the frontend.
    Expects a JSON body with a 'message' field.
    """
    try:
        # Log the raw request data
        content_type = request.headers.get('content-type', '').lower()
        logger.info(f"Chat request received. Content-Type: {content_type}")
        
        # Parse the request data
        try:
            if content_type == 'application/json':
                json_data = await request.json()
                logger.debug(f"Received JSON data: {json_data}")
                message = ChatMessage(**json_data)
            else:
                form_data = await request.form()
                logger.debug(f"Received form data: {dict(form_data)}")
                message = ChatMessage(**dict(form_data))
        except Exception as e:
            logger.error(f"Error parsing request data: {str(e)}")
            raise HTTPException(
                status_code=422,
                detail=f"Invalid request data. Please provide a 'message' field. Error: {str(e)}"
            )
        
        # Get and validate the message text
        message_text = message.get_text().strip()
        if not message_text:
            logger.warning("Received empty message text")
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        logger.info(f"Processing message (first 100 chars): {message_text[:100]}")
        
        # Get session ID from headers or use a default
        session_id = request.headers.get('X-Session-ID', 'default')
        
        # Get response from the AI model with session ID
        response_text = await chat_with_law_agent(message_text, session_id=session_id)
        
        if not response_text:
            logger.error("Received empty response from chat_with_law_agent")
            raise HTTPException(
                status_code=500,
                detail="Received empty response from the AI model"
            )
        
        logger.info(f"Sending response (first 100 chars): {response_text[:100]}")
        
        # Create and return the response
        response = ChatResponse(
            id=str(int(datetime.now().timestamp() * 1000)),
            text=response_text,
            isUser=False,
            timestamp=datetime.now()
        )
        
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        logger.error(f"HTTP error in chat endpoint: {he.detail}")
        raise
        
    except Exception as e:
        # Log unexpected errors and return a generic error message
        error_msg = f"Unexpected error in chat endpoint: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your request"
        )

# Original chat endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: Request):
    return await handle_chat_message(request)

# New endpoint to match frontend expectation
@app.post("/api/chat/message", response_model=ChatResponse)
async def chat_message(request: Request):
    return await handle_chat_message(request)

# --- Include Routers ---
app.include_router(documents_router.router, prefix="/api")
app.include_router(appointments_router.router)
app.include_router(portia_chat_router.router)
app.include_router(portia_rag_router.router)
app.include_router(portia_appointments_router.router)
app.include_router(portia_evidence_router.router)
app.include_router(portia_compliance_router.router)

# --- AI Court Integration ---
from backend.ai_court.api.endpoints import router as ai_court_router
from fastapi.responses import HTMLResponse

# Update the static files path to point to the correct location
ai_court_static_path = os.path.join(os.path.dirname(__file__), "ai_court", "static")

# Serve static files from the ai_court/static directory
app.mount("/ai-court/static", StaticFiles(directory=ai_court_static_path), name="ai-court-static")

# Also serve static files from the root /static path for audio files
app.mount("/static", StaticFiles(directory=ai_court_static_path), name="static")

# Include the API endpoints
app.include_router(ai_court_router, prefix="/ai-court/api")

# Serve the AI Court interface
@app.get("/ai-court")
@app.get("/ai-court/")
@app.get("/ai-court/{full_path:path}")
async def ai_court_interface(full_path: str = None):
    """Serve the AI Court interface"""
    # Always return the index.html for any path under /ai-court
    # The frontend router will handle client-side routing
    ai_court_html_path = os.path.join(ai_court_static_path, "index.html")
    
    if not os.path.exists(ai_court_html_path):
        raise HTTPException(status_code=404, detail="AI Court interface not found")
        
    with open(ai_court_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Update base URL in the HTML to ensure all relative paths work
    html_content = html_content.replace(
        '<head>',
        f'<head>\n    <base href="/ai-court/">',
        1
    )
    
    return HTMLResponse(content=html_content, status_code=200)

# --- End AI Court Integration ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
