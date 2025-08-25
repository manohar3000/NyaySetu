# Portia Labs AI – Optional Chatbot (Separate from existing chatbot)

This guide shows how to add a separate chatbot powered by Portia Labs AI without changing the current chatbot or AI Court features.

- Requires Python >= 3.11
- Uses your existing Gemini key via `GOOGLE_API_KEY`
- Toggle with `PORTIA_ENABLED=true`

## 1) Install dependency

```bash
pip install "portia-sdk-python[google]"
```

Or it’s already included in the project-level `requirements.txt`.

## 2) Environment variables

Add to your `.env`:

```
PORTIA_ENABLED=true
PORTIA_DEFAULT_MODEL=gemini-2.5-flash  # optional; default used if omitted
GOOGLE_API_KEY=your_google_gemini_api_key
```

## 3) Client wrapper

We provide `backend/integrations/portia_client.py`:

- `run_one_shot(query, context=None, **kwargs)` – generate + execute a Portia plan
- `generate_plan(query, context=None, **kwargs)` – returns a Plan
- `execute_plan(plan)` – runs a Plan

If Portia or env is not configured, functions raise a clear `PortiaUnavailable` error.

## 4) Minimal FastAPI route (optional, separate service)

Create a new router file (example name `backend/routers/portia_chat.py`) and mount it in `app.py` (do not modify existing chatbot):

```python
# backend/routers/portia_chat.py
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
```

Then in your `backend/app.py`:

```python
from backend.routers import portia_chat
app.include_router(portia_chat.router)
```

This exposes a new, optional endpoint at `POST /portia/chat` that uses Portia while leaving your original chatbot untouched.

## 5) Frontend (optional)

- Add a new tab/button “Portia Chat” that targets `/portia/chat` instead of your existing `/api/chat`.
- Keep it isolated so both chat experiences can be evaluated independently.

## 6) Notes

- Portia SDK prefers Python 3.11+. Update Docker base image to `python:3.11-slim` or `3.12-slim` before using in containers.
- You can switch models by passing `default_model="gemini-2.5-pro"` into `get_client()` in `portia_client.py` or by setting `PORTIA_DEFAULT_MODEL`.
