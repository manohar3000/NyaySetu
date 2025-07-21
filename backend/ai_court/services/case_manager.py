import uuid
from datetime import datetime
from typing import List, Dict, Optional
import json
import os
from pathlib import Path

from backend.ai_court.models.api_models import CaseDetails, CaseSession, CaseStatus, PracticeConfig, CaseStartResponse

class CaseManager:
    def __init__(self):
        self.cases_file = Path("data/cases.json")
        self.sessions_file = Path("data/sessions.json")
        self._ensure_data_directory()
        self.cases = self._load_cases()
        self.sessions = self._load_sessions()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        self.cases_file.parent.mkdir(parents=True, exist_ok=True)
    
    def _load_cases(self) -> Dict[str, CaseDetails]:
        """Load cases from file"""
        if self.cases_file.exists():
            try:
                with open(self.cases_file, 'r') as f:
                    data = json.load(f)
                    return {case_id: CaseDetails(**case_data) for case_id, case_data in data.items()}
            except Exception as e:
                print(f"Error loading cases: {e}")
        return {}
    
    def _save_cases(self):
        """Save cases to file"""
        try:
            with open(self.cases_file, 'w') as f:
                json.dump({case_id: case.dict() for case_id, case in self.cases.items()}, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving cases: {e}")
    
    def _load_sessions(self) -> Dict[str, CaseSession]:
        """Load sessions from file"""
        if self.sessions_file.exists():
            try:
                with open(self.sessions_file, 'r') as f:
                    data = json.load(f)
                    return {session_id: CaseSession(**session_data) for session_id, session_data in data.items()}
            except Exception as e:
                print(f"Error loading sessions: {e}")
        return {}
    
    def _save_sessions(self):
        """Save sessions to file"""
        try:
            with open(self.sessions_file, 'w') as f:
                json.dump({session_id: session.dict() for session_id, session in self.sessions.items()}, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving sessions: {e}")
    
    def create_case(self, case_details: CaseDetails) -> str:
        """Create a new case"""
        case_id = str(uuid.uuid4())
        case_details.caseId = case_id
        case_details.createdAt = datetime.now()
        case_details.lastModified = datetime.now()
        case_details.status = CaseStatus.SETUP
        
        # Set default values for optional fields if not provided
        if not case_details.caseNumber:
            case_details.caseNumber = f"PC-{int(datetime.now().timestamp())}"
        if not case_details.court:
            case_details.court = "Practice Court"
        if not case_details.damages:
            case_details.damages = "To be determined"
        
        self.cases[case_id] = case_details
        self._save_cases()
        return case_id
    
    def get_case(self, case_id: str) -> Optional[CaseDetails]:
        """Get case by ID"""
        return self.cases.get(case_id)
    
    def get_all_cases(self) -> List[CaseDetails]:
        """Get all cases"""
        return list(self.cases.values())
    
    def update_case_status(self, case_id: str, status: CaseStatus):
        """Update case status"""
        if case_id in self.cases:
            self.cases[case_id].status = status
            self.cases[case_id].lastModified = datetime.now()
            self._save_cases()
    
    def create_session(self, case_id: str, practice_config: PracticeConfig) -> str:
        """Create a new session for a case"""
        session_id = str(uuid.uuid4())
        session = CaseSession(
            sessionId=session_id,
            caseId=case_id,
            practiceConfig=practice_config,
            sessionStartTime=datetime.now(),
            isActive=True
        )
        
        self.sessions[session_id] = session
        self._save_sessions()
        
        # Update case status to active
        self.update_case_status(case_id, CaseStatus.ACTIVE)
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[CaseSession]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session_history(self, session_id: str, debate_history: List[Dict[str, str]]):
        """Update session debate history"""
        if session_id in self.sessions:
            self.sessions[session_id].debateHistory = debate_history
            self.sessions[session_id].lastModified = datetime.now()
            self._save_sessions()
    
    def end_session(self, session_id: str):
        """End a session"""
        if session_id in self.sessions:
            self.sessions[session_id].isActive = False
            self.sessions[session_id].sessionEndTime = datetime.now()
            self._save_sessions()
    
    def get_active_sessions(self) -> List[CaseSession]:
        """Get all active sessions"""
        return [session for session in self.sessions.values() if session.isActive]
    
    def get_sessions_for_case(self, case_id: str) -> List[CaseSession]:
        """Get all sessions for a specific case"""
        return [session for session in self.sessions.values() if session.caseId == case_id]
    
    def delete_case(self, case_id: str):
        """Delete a case and all its sessions"""
        if case_id in self.cases:
            del self.cases[case_id]
            # Delete associated sessions
            sessions_to_delete = [session_id for session_id, session in self.sessions.items() if session.caseId == case_id]
            for session_id in sessions_to_delete:
                del self.sessions[session_id]
            self._save_cases()
            self._save_sessions()

# Global case manager instance
case_manager = CaseManager() 