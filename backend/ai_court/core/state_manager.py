from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
import hashlib

class DebateState(BaseModel):
    """State container for the turn-based debate flow"""
    session_id: str
    case_type: str
    specific_issue: str
    case_summary: str
    user_role: str  # "plaintiff" or "defendant"
    
    # Debate state
    debate_history: List[Dict[str, Any]] = Field(default_factory=list)  # {role: str, content: str, timestamp: datetime}
    evidence_presented: List[Dict[str, Any]] = Field(default_factory=list)
    objections_raised: List[Dict[str, str]] = Field(default_factory=list)
    
    # Turn management
    current_speaker: str = "judge"  # "judge", "ai_lawyer", or "user"
    waiting_for: str = "user"  # Next expected speaker
    last_turn_time: datetime = Field(default_factory=datetime.utcnow)
    
    # Persona configurations
    judge_persona: str = "an experienced High Court Judge with 20+ years of experience"
    ai_lawyer_persona: str = "a seasoned defense attorney with 15+ years of experience"
    
    # Turn tracking
    current_round: int = 1
    max_rounds: int = 10  # Maximum number of debate rounds
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        arbitrary_types_allowed = True
    
    def to_dict(self):
        """Convert state to dictionary for storage"""
        return {
            "session_id": self.session_id,
            "case_type": self.case_type,
            "specific_issue": self.specific_issue,
            "case_summary": self.case_summary,
            "user_role": self.user_role,
            "debate_history": self.debate_history,
            "evidence_presented": self.evidence_presented,
            "objections_raised": self.objections_raised,
            "current_turn": self.current_turn,
            "last_updated": self.last_updated.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create state from dictionary"""
        if isinstance(data.get("last_updated"), str):
            data["last_updated"] = datetime.fromisoformat(data["last_updated"])
        return cls(**data)

class StateManager:
    """Manages turn-based debate state and flow"""
    def __init__(self):
        self.sessions: Dict[str, DebateState] = {}
        self.workflow = self._create_workflow()
    
    def _create_workflow(self):
        """Create LangGraph workflow for debate flow"""
        
    def validate_turn(self, session_id: str, speaker: str) -> bool:
        """Validate if it's the speaker's turn"""
        if session_id not in self.sessions:
            return False
            
        state = self.sessions[session_id]
        return state.waiting_for == speaker
    
    def add_message(self, session_id: str, role: str, content: str) -> bool:
        """Add a message to the debate history and update turn state"""
        if session_id not in self.sessions:
            return False
            
        state = self.sessions[session_id]
        
        # Validate turn order
        if role != state.waiting_for and role != "judge":
            return False
            
        # Add to history
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        state.debate_history.append(message)
        
        # Update turn state
        state.current_speaker = role
        state.last_updated = datetime.utcnow()
        
        # Determine next speaker
        if role == "judge":
            # After judge, it's the user's turn if they haven't spoken yet this round
            if state.waiting_for == "user" and any(m["role"] == "user" for m in state.debate_history[-2:]):
                state.waiting_for = "ai_lawyer"
            else:
                state.waiting_for = "user"
        elif role == "user":
            state.waiting_for = "ai_lawyer"
        elif role == "ai_lawyer":
            state.waiting_for = "judge"
            state.current_round += 1
            
        return True
    
    def get_judge_prompt(self, session_id: str) -> str:
        """Generate prompt for the judge based on current debate state"""
        if session_id not in self.sessions:
            return ""
            
        state = self.sessions[session_id]
        history = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in state.debate_history[-5:]])
        
        return f"""You are {state.judge_persona} presiding over this case. 
        
        CASE: {state.case_type} - {state.specific_issue}
        
        RECENT DIALOGUE:
        {history}
        
        Your task is to:
        1. Acknowledge the last statement
        2. Provide a concise ruling or guidance
        3. Direct the next steps in the proceeding
        
        Keep your response under 3 sentences. Be decisive and maintain courtroom decorum."""
    
    def get_ai_lawyer_prompt(self, session_id: str) -> str:
        """Generate prompt for the AI lawyer based on current debate state"""
        if session_id not in self.sessions:
            return ""
            
        state = self.sessions[session_id]
        history = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in state.debate_history[-5:]])
        
        return f"""You are {state.ai_lawyer_persona} representing the {'defendant' if state.user_role == 'plaintiff' else 'plaintiff'}.
        
        CASE: {state.case_type} - {state.specific_issue}
        
        RECENT DIALOGUE:
        {history}
        
        Your task is to:
        1. Respond to the last statement
        2. Make a strong legal argument or counter-argument
        3. Reference relevant laws and precedents when possible
        
        Keep your response under 100 words. Be persuasive but professional."""
        workflow = StateGraph(DebateState)
        
        # Define nodes
        workflow.add_node("process_prosecution", self._process_prosecution)
        workflow.add_node("process_defense", self._process_defense)
        workflow.add_node("evaluate_arguments", self._evaluate_arguments)
        
        # Define edges
        workflow.add_conditional_edges(
            "process_prosecution",
            self._decide_next_step,
            {
                "defense": "process_defense",
                "evaluate": "evaluate_arguments",
                "end": END
            }
        )
        
        workflow.add_edge("process_defense", "process_prosecution")
        workflow.add_edge("evaluate_arguments", END)
        
        # Set entry point
        workflow.set_entry_point("process_prosecution")
        
        return workflow.compile()
    
    async def _process_prosecution(self, state: DebateState):
        """Process prosecution's turn"""
        # Update state
        state.current_turn = "prosecution"
        state.last_updated = datetime.utcnow()
        return state
    
    async def _process_defense(self, state: DebateState):
        """Process defense's turn"""
        state.current_turn = "defense"
        state.last_updated = datetime.utcnow()
        return state
    
    async def _evaluate_arguments(self, state: DebateState):
        """Evaluate the current state of arguments"""
        # Add any evaluation logic here
        return state
    
    def _decide_next_step(self, state: DebateState):
        """Determine next step in the workflow"""
        # Example logic - can be customized
        if len(state.debate_history) >= 10:  # End after 10 exchanges
            return "end"
        elif state.current_turn == "prosecution":
            return "defense"
        return "prosecution"
    
    # Session management
    def create_session(self, case_details: Dict[str, Any]) -> str:
        """Create a new debate session"""
        session_id = hashlib.md5(f"{datetime.utcnow()}{case_details}".encode()).hexdigest()
        self.sessions[session_id] = DebateState(
            session_id=session_id,
            case_type=case_details.get("case_type", "Criminal"),
            specific_issue=case_details.get("specific_issue", ""),
            case_summary=case_details.get("case_summary", ""),
            user_role=case_details.get("user_role", "prosecution")
        )
        return session_id
    
    def get_session(self, session_id: str) -> Optional[DebateState]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session with new data"""
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        for key, value in updates.items():
            if hasattr(session, key):
                setattr(session, key, value)
        
        session.last_updated = datetime.utcnow()
        return True
    
    def add_to_history(self, session_id: str, role: str, content: str):
        """Add message to debate history"""
        if session_id not in self.sessions:
            return False
        
        self.sessions[session_id].debate_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        return True
    
    def get_recent_history(self, session_id: str, limit: int = 5) -> List[Dict[str, str]]:
        """Get recent debate history"""
        if session_id not in self.sessions:
            return []
        return self.sessions[session_id].debate_history[-limit:]
    
    def cleanup_old_sessions(self, hours: int = 24):
        """Remove sessions older than specified hours"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        to_remove = [
            sid for sid, session in self.sessions.items() 
            if session.last_updated < cutoff
        ]
        for sid in to_remove:
            del self.sessions[sid]
        return len(to_remove)

# Global instance
state_manager = StateManager()
