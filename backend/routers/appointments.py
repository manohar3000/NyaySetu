from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from pydantic import BaseModel

from backend.appointment_service import (
    AppointmentRequest,
    AppointmentSlot,
    Appointment,
    appointment_manager
)
from backend.auth import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppointmentCreate(BaseModel):
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    timezone: str = "UTC"

class AppointmentResponse(BaseModel):
    id: str
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    status: str
    timezone: str
    created_at: datetime
    updated_at: datetime

@router.post("/suggest-slots", response_model=List[AppointmentSlot])
async def suggest_appointment_slots(
    request: AppointmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get suggested available time slots for an appointment
    """
    try:
        # In a real app, you would fetch existing appointments from a database
        existing_appointments = []
        
        # Get suggested slots from the appointment manager
        slots = await appointment_manager.suggest_available_slots(
            request=request,
            existing_appointments=existing_appointments
        )
        
        return slots
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suggesting appointment slots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while suggesting appointment slots"
        )

@router.post("/book", response_model=AppointmentResponse)
async def book_appointment(
    appointment_data: AppointmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Book a new appointment
    """
    try:
        # Book the appointment
        appointment = await appointment_manager.book_appointment(
            user_id=current_user["id"],
            title=appointment_data.title,
            description=appointment_data.description,
            start_time=appointment_data.start_time,
            end_time=appointment_data.end_time,
            timezone=appointment_data.timezone
        )
        
        # Convert to response model
        return AppointmentResponse(**appointment.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while booking the appointment"
        )

@router.get("/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[str] = None
):
    """
    Get all appointments for the current user
    """
    try:
        appointments = await appointment_manager.get_user_appointments(
            user_id=current_user["id"]
        )
        
        # Apply status filter if provided
        if status_filter:
            appointments = [
                appt for appt in appointments 
                if appt.status.lower() == status_filter.lower()
            ]
        
        # Sort by start time (newest first)
        appointments.sort(key=lambda x: x.start_time, reverse=True)
        
        return [AppointmentResponse(**appt.dict()) for appt in appointments]
        
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching appointments"
        )

@router.post("/{appointment_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel an existing appointment
    """
    try:
        success = await appointment_manager.cancel_appointment(
            appointment_id=appointment_id,
            user_id=current_user["id"]
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel appointment"
            )
            
        return {"message": "Appointment cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while cancelling the appointment"
        )
