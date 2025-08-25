from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from backend.integrations.portia_client import run_one_shot, PortiaUnavailable

router = APIRouter(prefix="/portia/rag", tags=["portia-rag-admin"])

class RunRagPlanBody(BaseModel):
    urls: Optional[List[HttpUrl]] = None
    domain: Optional[str] = None  # e.g., court.gov.in
    notes: Optional[str] = None

@router.post("/run-plan")
async def run_rag_plan(body: RunRagPlanBody):
    """
    Kick off a Portia plan to crawl and ingest sources into Qdrant.
    Does not change existing AI Court logic.
    """
    if not body.urls and not body.domain:
        raise HTTPException(status_code=422, detail="Provide at least one of: urls or domain")

    try:
        query_parts = [
            "Crawl and ingest legal sources for RAG.",
            "Extract only legally relevant text, normalize, chunk, embed, and upsert to Qdrant.",
        ]
        if body.domain:
            query_parts.append(f"Domain: {body.domain}")
        if body.urls:
            joined = "\n".join(map(str, body.urls))
            query_parts.append(f"URLs:\n{joined}")
        if body.notes:
            query_parts.append(f"Notes: {body.notes}")

        query = "\n".join(query_parts)
        result = run_one_shot(query, context={"task": "rag_ingestion"})
        return {"ok": True, "data": str(result)}
    except PortiaUnavailable as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portia error: {e}")
