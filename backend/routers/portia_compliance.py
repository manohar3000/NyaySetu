from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.integrations.portia_client import run_one_shot, PortiaUnavailable

router = APIRouter(prefix="/portia/compliance", tags=["portia-compliance"])

class ComplianceBody(BaseModel):
    content: str  # raw text extracted from a document
    doc_type: Optional[str] = None  # e.g., "contract", "affidavit", "petition"
    jurisdiction: Optional[str] = None

@router.post("/check")
async def compliance_check(body: ComplianceBody):
    """Run a Portia plan that checks for missing fields/sections and deadlines and returns a concise report."""
    try:
        query = (
            "Given the provided legal text, perform a compliance audit: identify missing sections/fields, "
            "flag potential issues, and list upcoming deadlines if applicable. Return concise JSON with fields: "
            "missing_items, issues, recommendations, deadlines."
        )
        context = body.model_dump(exclude_none=True)
        result = run_one_shot(query, context=context)
        return {"ok": True, "data": str(result)}
    except PortiaUnavailable as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portia error: {e}")
