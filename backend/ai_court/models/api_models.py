from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class CaseStatus(str, Enum):
    SETUP = "setup"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class CaseType(str, Enum):
    CRIMINAL = "criminal"
    CIVIL = "civil"
    FAMILY = "family"
    CONTRACT = "contract"
    PROPERTY = "property"
    EMPLOYMENT = "employment"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    CONSTITUTIONAL = "constitutional"
    TAX = "tax"
    ENVIRONMENTAL = "environmental"

class PracticeConfig(BaseModel):
    caseType: Optional[str] = Field(None, description="Type of case (criminal, civil, etc.)")
    specificIssue: Optional[str] = Field(None, description="Specific legal issue")
    caseSummary: Optional[str] = Field(None, description="Summary of case facts")
    opponentExperience: Optional[str] = Field(None, description="Opponent's experience level")
    opponentStyle: Optional[str] = Field(None, description="Opponent's argument style")
    opponentStrengths: Optional[str] = Field(None, description="Opponent's strengths")
    difficultyLevel: Optional[str] = Field(None, description="Practice difficulty level")
    judgeStrictness: Optional[str] = Field(None, description="Judge strictness level")
    timePressure: Optional[str] = Field(None, description="Time pressure setting")
    userRole: Optional[str] = Field(None, description="User's role in the case")
    keyArguments: Optional[str] = Field(None, description="Key arguments to practice")

class CaseDetails(BaseModel):
    caseId: Optional[str] = Field(None, description="Unique case identifier")
    caseTitle: str = Field(..., description="Title of the case")
    caseType: CaseType = Field(..., description="Type of case")
    specificIssue: str = Field(..., description="Specific legal issue being practiced")
    caseSummary: str = Field(..., description="Detailed case summary")
    plaintiff: str = Field(..., description="Plaintiff/Prosecution party")
    defendant: str = Field(..., description="Defendant party")
    userRole: str = Field(..., description="User's role (plaintiff/defendant/prosecutor/defense)")
    keyArguments: List[str] = Field(default_factory=list, description="Key arguments to practice")
    damages: Optional[str] = Field(None, description="Damages or relief sought")
    court: Optional[str] = Field(None, description="Court where case is being heard")
    caseNumber: Optional[str] = Field(None, description="Case number")
    createdAt: Optional[datetime] = Field(None, description="Case creation timestamp")
    lastModified: Optional[datetime] = Field(None, description="Last modification timestamp")
    status: Optional[CaseStatus] = Field(None, description="Current case status")

class CaseSession(BaseModel):
    sessionId: str = Field(..., description="Unique session identifier")
    caseId: str = Field(..., description="Associated case ID")
    practiceConfig: PracticeConfig = Field(..., description="Practice session configuration")
    debateHistory: List[Dict[str, str]] = Field(default_factory=list, description="Session debate history")
    sessionStartTime: datetime = Field(default_factory=datetime.now, description="Session start time")
    sessionEndTime: Optional[datetime] = Field(None, description="Session end time")
    isActive: bool = Field(default=True, description="Whether session is currently active")

class DebateInput(BaseModel):
    human_input: str = Field(..., description="The human lawyer's statement or question.")
    debate_history: List[Dict[str, str]] = Field(default_factory=list, description="List of previous debate turns (role and content).")
    practice_config: Optional[PracticeConfig] = Field(None, description="Practice session configuration")
    case_details: Optional[CaseDetails] = Field(None, description="Case details for new cases")
    session_id: Optional[str] = Field(None, description="Session ID for continuing cases")

class DebateTurnResponse(BaseModel):
    ai_lawyer_response: Optional[str] = Field(None, description="AI lawyer's response, or None if no response needed")
    judge_intervention: Optional[str] = Field(None, description="Judge's intervention, or None if no intervention needed")
    sources: Dict[str, List[Dict[str, Any]]]
    metadata: Dict[str, List[str]]
    case_status: Optional[CaseStatus] = Field(None, description="Updated case status")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")
    ai_lawyer_audio_url: Optional[str] = Field(None, description="Audio URL for AI lawyer's response")
    judge_audio_url: Optional[str] = Field(None, description="Audio URL for judge's intervention")

class CaseListResponse(BaseModel):
    cases: List[CaseDetails] = Field(..., description="List of available cases")
    total_count: int = Field(..., description="Total number of cases")

class CaseStartResponse(BaseModel):
    session_id: str = Field(..., description="New session ID")
    case_id: str = Field(..., description="Case ID")
    judge_opening: str = Field(..., description="Judge's opening statement")
    case_status: CaseStatus = Field(..., description="Updated case status")
