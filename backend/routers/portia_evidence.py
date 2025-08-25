from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.integrations.portia_client import run_one_shot, PortiaUnavailable

router = APIRouter(prefix="/portia/evidence", tags=["portia-evidence-assistant"])

class EvidenceContext(BaseModel):
    case_type: Optional[str] = None
    jurisdiction: Optional[str] = None
    parties: Optional[List[str]] = None
    facts_summary: Optional[str] = None

@router.post("/assistant")
async def evidence_assistant(ctx: EvidenceContext):
    """
    Guides the user through evidence gathering steps and returns a structured checklist
    with next actions, suggested documents, and deadlines.
    """
    try:
        query = (
            "Given a legal matter, produce a structured evidence collection plan. "
            "Include: checklist items (with short rationale), suggested documents, potential sources, "
            "and any immediate deadlines. Return concise JSON fields: checklist, documents, sources, deadlines."
        )
        result = run_one_shot(query, context=ctx.model_dump(exclude_none=True))
        return {"ok": True, "data": str(result)}
    except PortiaUnavailable as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portia error: {e}")
