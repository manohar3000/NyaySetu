from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.integrations.portia_client import run_one_shot, PortiaUnavailable

router = APIRouter(prefix="/portia", tags=["portia-chatbot"])

class ChatBody(BaseModel):
    message: str
    context: dict | None = None

@router.post("/chat")
async def portia_chat(body: ChatBody):
    try:
        result = run_one_shot(body.message, context=body.context)
        # Portia returns a rich object; normalize to text if needed
        return {"ok": True, "data": str(result)}
    except PortiaUnavailable as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portia error: {e}")
