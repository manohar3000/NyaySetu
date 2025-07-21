import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import google.generativeai as genai
from pydantic import BaseModel, Field, validator
from fastapi import HTTPException, status

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY = "AIzaSyDFn9PgAJi9vyCPEAMMM45QpMG9DTm-uE0"
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    logger.error(f"Error initializing Gemini API: {str(e)}")
    raise

class AppointmentRequest(BaseModel):
    """Model for appointment request data"""
    user_id: str
    title: str
    description: str
    preferred_date: str
    preferred_time: str
    duration_minutes: int = Field(30, ge=15, le=240)  # 15 min to 4 hours
    timezone: str = "UTC"

    @validator('preferred_date')
    def validate_date(cls, v):
        try:
            return datetime.strptime(v, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")

    @validator('preferred_time')
    def validate_time(cls, v):
        try:
            return datetime.strptime(v, '%H:%M').time()
        except ValueError:
            raise ValueError("Time must be in HH:MM format")

class AppointmentSlot(BaseModel):
    """Model for available appointment slots"""
    start_time: datetime
    end_time: datetime
    confidence: float = Field(..., ge=0, le=1)

class Appointment(BaseModel):
    """Model for confirmed appointments"""
    id: str
    user_id: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    timezone: str = "UTC"

class AppointmentManager:
    """Manages appointment scheduling and interactions with Gemini API"""
    
    def __init__(self):
        self.model = model
        self.appointments: Dict[str, Appointment] = {}
    
    async def suggest_available_slots(
        self, 
        request: AppointmentRequest,
        existing_appointments: List[Dict] = None
    ) -> List[AppointmentSlot]:
        """
        Use Gemini to suggest available time slots based on the request and existing appointments
        """
        try:
            # Prepare context for the AI
            context = self._prepare_scheduling_context(request, existing_appointments)
            
            # Generate prompt for the AI
            prompt = self._create_scheduling_prompt(context)
            
            # Get AI response
            response = self.model.generate_content(prompt)
            
            # Parse the AI response to get suggested slots
            suggested_slots = self._parse_ai_response(response.text)
            
            return suggested_slots
            
        except Exception as e:
            logger.error(f"Error suggesting available slots: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error suggesting available slots: {str(e)}"
            )
    
    def _prepare_scheduling_context(
        self, 
        request: AppointmentRequest,
        existing_appointments: List[Dict] = None
    ) -> Dict:
        """Prepare context for the AI to make scheduling decisions"""
        preferred_datetime = datetime.combine(
            request.preferred_date,
            request.preferred_time
        )
        
        context = {
            "request": {
                "title": request.title,
                "description": request.description,
                "preferred_datetime": preferred_datetime.isoformat(),
                "duration_minutes": request.duration_minutes,
                "timezone": request.timezone
            },
            "existing_appointments": existing_appointments or [],
            "current_datetime": datetime.utcnow().isoformat(),
            "business_hours": {
                "start": "09:00",
                "end": "17:00",
                "timezone": request.timezone
            }
        }
        
        return context
    
    def _create_scheduling_prompt(self, context: Dict) -> str:
        """Create a prompt for the AI to suggest available time slots"""
        prompt = f"""
        You are an AI scheduling assistant. Help find the best available time slots for an appointment.
        
        Appointment Details:
        - Title: {context['request']['title']}
        - Description: {context['request']['description']}
        - Preferred Time: {context['request']['preferred_datetime']} ({context['request']['timezone']})
        - Duration: {context['request']['duration_minutes']} minutes
        
        Business Hours: {context['business_hours']['start']} to {context['business_hours']['end']} {context['business_hours']['timezone']}
        Current Time: {context['current_datetime']}
        
        Existing Appointments:
        """
        
        if context['existing_appointments']:
            for appt in context['existing_appointments']:
                prompt += f"- {appt['start_time']} to {appt['end_time']}: {appt.get('title', 'No title')}\n"
        else:
            prompt += "No existing appointments found.\n"
        
        prompt += """
        Please suggest 3 available time slots for this appointment, considering:
        1. Business hours (9 AM to 5 PM)
        2. Existing appointments
        3. The user's preferred time (try to stay close to it)
        4. Standard meeting durations (30, 45, 60 minutes)
        
        Format your response as a JSON array of objects with these fields:
        [
            {
                "start_time": "ISO 8601 datetime",
                "end_time": "ISO 8601 datetime",
                "confidence": 0.0-1.0
            }
        ]
        """
        
        return prompt
    
    def _parse_ai_response(self, response_text: str) -> List[AppointmentSlot]:
        """Parse the AI response to extract suggested time slots"""
        try:
            import json
            import re
            
            # Clean up the response to extract just the JSON part
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if not json_match:
                raise ValueError("Could not find JSON array in AI response")
                
            json_str = json_match.group(0)
            slots_data = json.loads(json_str)
            
            # Convert to AppointmentSlot objects
            slots = []
            for slot_data in slots_data:
                slot = AppointmentSlot(
                    start_time=datetime.fromisoformat(slot_data['start_time']),
                    end_time=datetime.fromisoformat(slot_data['end_time']),
                    confidence=float(slot_data.get('confidence', 0.8))
                )
                slots.append(slot)
                
            return slots
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    async def book_appointment(
        self, 
        user_id: str,
        title: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        timezone: str = "UTC"
    ) -> Appointment:
        """
        Book a new appointment
        """
        try:
            # Check for conflicts
            if self._has_scheduling_conflict(start_time, end_time):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="The selected time slot is no longer available"
                )
            
            # Create new appointment
            appointment_id = f"apt_{len(self.appointments) + 1}"
            new_appointment = Appointment(
                id=appointment_id,
                user_id=user_id,
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                timezone=timezone
            )
            
            # Store the appointment (in a real app, this would be in a database)
            self.appointments[appointment_id] = new_appointment
            
            return new_appointment
            
        except Exception as e:
            logger.error(f"Error booking appointment: {str(e)}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error booking appointment: {str(e)}"
            )
    
    def _has_scheduling_conflict(self, start_time: datetime, end_time: datetime) -> bool:
        """Check if the requested time slot conflicts with existing appointments"""
        for appointment in self.appointments.values():
            if (
                (start_time < appointment.end_time) and 
                (end_time > appointment.start_time)
            ):
                return True
        return False
    
    async def get_user_appointments(self, user_id: str) -> List[Appointment]:
        """Get all appointments for a specific user"""
        return [
            appt for appt in self.appointments.values() 
            if appt.user_id == user_id
        ]
    
    async def cancel_appointment(self, appointment_id: str, user_id: str) -> bool:
        """Cancel an existing appointment"""
        if appointment_id not in self.appointments:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
            
        appointment = self.appointments[appointment_id]
        if appointment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this appointment"
            )
            
        appointment.status = "cancelled"
        appointment.updated_at = datetime.utcnow()
        return True

# Initialize appointment manager
appointment_manager = AppointmentManager()
