from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from pathlib import Path
from typing import Dict, Any

from backend.ai_court.core.config import settings
from backend.ai_court.services.document_ingestion import ingest_document
from backend.ai_court.services.debate_orchestrator import conduct_debate_turn, start_new_case, continue_case
from backend.ai_court.models.api_models import (
    DebateInput, DebateTurnResponse, CaseDetails, CaseListResponse, 
    CaseStartResponse, PracticeConfig
)
from backend.ai_court.services.case_manager import case_manager
from backend.ai_court.api.endpoints import router as api_router

app = FastAPI(title="LegalAI - Advanced Legal Debate Assistant", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

# Case Management Endpoints
@app.get("/api/cases", response_model=CaseListResponse)
async def get_cases():
    """Get all available cases"""
    cases = case_manager.get_all_cases()
    return CaseListResponse(cases=cases, total_count=len(cases))

@app.post("/api/cases", response_model=CaseStartResponse)
async def create_case(request_body: Dict[str, Any] = Body(...)):
    """Create a new case and start a session"""
    case_details = CaseDetails(**request_body["case_details"])
    practice_config = request_body["practice_config"]
    return await start_new_case(case_details, practice_config)

@app.get("/api/cases/{case_id}")
async def get_case(case_id: str):
    """Get a specific case by ID"""
    case = case_manager.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session by ID"""
    session = case_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.post("/api/sessions/{session_id}/continue", response_model=DebateTurnResponse)
async def continue_session(session_id: str, request_body: Dict[str, Any] = Body(...)):
    """Continue an existing case session"""
    human_input = request_body["human_input"]
    return await continue_case(session_id, human_input)

@app.post("/api/sessions/{session_id}/end")
async def end_session(session_id: str):
    """End a session"""
    case_manager.end_session(session_id)
    return {"message": "Session ended successfully"}

# Existing endpoints
@app.post("/debate_turn", response_model=DebateTurnResponse)
async def debate_turn(input: DebateInput):
    """Conduct a single turn of the legal debate"""
    return await conduct_debate_turn(input)

@app.post("/upload_case_materials")
async def upload_case_materials(
    file: UploadFile = File(...),
    case_name: str = Form(None),
    court: str = Form(None),
    judgement_date: str = Form(None),
    tags: str = Form(None)
):
    """Upload and process legal documents"""
    try:
        result = await ingest_document(file, case_name, court, judgement_date, tags)
        return {"message": "Document uploaded successfully", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
