from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.integrations.portia_client import run_one_shot, PortiaUnavailable

router = APIRouter(prefix="/portia/appointments", tags=["portia-appointments-triage"])

class TriageBody(BaseModel):
    description: str
    preferred_time_range: Optional[str] = None  # e.g., "Mon-Fri 10:00-18:00 IST"
    location: Optional[str] = None

@router.post("/triage")
async def appointments_triage(body: TriageBody):
    """Use Portia to triage appointment requests and suggest specialization + slots."""
    try:
        query = (
            "Analyze the user's legal matter description, extract key entities (jurisdiction, matter type, urgency), "
            "suggest an appropriate lawyer specialization and propose time slots aligned with preferred window if provided. "
            "Return a concise JSON with fields: specialization, urgency, entities, suggested_slots."
        )
        context = {
            "description": body.description,
            "preferred_time_range": body.preferred_time_range,
            "location": body.location,
        }
        result = run_one_shot(query, context=context)
        return {"ok": True, "data": str(result)}
    except PortiaUnavailable as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portia error: {e}")
