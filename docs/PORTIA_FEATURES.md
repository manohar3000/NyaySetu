# Portia Labs AI – Proposed Integrations (No changes to existing AI Court/Chatbot)

This document proposes where Portia can add value in NyaySetu without modifying your current AI Court or the existing chatbot.

Portia’s strengths: agentic planning, multi-step orchestration, tool usage, optional web automation. We keep Gemini as the LLM via `GOOGLE_API_KEY` and enable Portia with `PORTIA_ENABLED=true`.

## 1) Legal Research & RAG Ingestion Pipelines
- Location: `backend/ai_court/services/document_ingestion.py`, `backend/ai_court/services/metadata_extractor.py`, `backend/ai_court/core/qdrant_client.py`
- Plan: Crawl sources → extract legal text → clean & chunk → embed → upsert to Qdrant
- Benefit: Faster, repeatable ingestion for judgments/statutes; improves retrieval quality.
- Trigger: Admin endpoint (e.g., `/admin/rag/update`) or scheduled job.

## 2) Compliance/Policy Audits for Uploaded Docs
- Location: `backend/routers/documents.py`, `backend/ai_court/services/document_ingestion.py`
- Plan: After upload → detect document type → run compliance checklist (deadlines, sections, missing fields) → produce report
- Benefit: Structured checks reduce errors and rework; helpful to lawyers and citizens.

## 3) Appointment Triage and Smart Routing
- Location: `backend/appointment_service.py`, `backend/routers/appointments.py`
- Plan: Analyze user description → extract entities (jurisdiction, matter type, urgency) → suggest lawyer specialization, time slots, and prerequisites
- Benefit: Higher-quality bookings and reduced no-shows.

## 4) Evidence Gathering Assistant
- Location: New `backend/routers/evidence.py` (+ `backend/integrations/portia_client.py`)
- Plan: Guide users through evidence collection steps; generate action items and store a checklist; remind users via notifications
- Benefit: Structured preparation improves AI Court practice outcomes and real-world readiness.

## 5) Knowledge Workflows (Briefs, Case Notes, Summaries)
- Location: `backend/document_summarizer.py`
- Plan: Chain: extract → summarize per audience (citizen/lawyer) → generate brief/outline with citations → store to history
- Benefit: Consistent, traceable outputs; can be audited.

## 6) IVR Enhancements (Optional)
- Location: `IVR/gemini_chain.py`, `IVR/main.py` (no breaking changes)
- Plan: For long/complex user calls, Portia can prepare step-by-step plans and hand back short prompts to the existing Gemini flow
- Benefit: Keeps your IVR fast but more structured for complex intents.

## 7) Ops & Monitoring (Optional)
- Location: `backend/app.py` middleware and Portia wrappers
- Plan: Log plan steps, timings, and tool usage to aid debugging and QA. Keep this opt-in.

---

## Implementation Notes
- Dependency: `portia-sdk-python[google]` included in root `requirements.txt`.
- Env vars: `PORTIA_ENABLED=true`, `PORTIA_DEFAULT_MODEL=gemini-2.5-flash`, and `GOOGLE_API_KEY`.
- Wrapper: `backend/integrations/portia_client.py` offers `generate_plan`, `execute_plan`, and `run_one_shot`.
- Docker: Upgrade to Python 3.11+ (`python:3.12-slim`) if you plan to run Portia flows in containers.

---

## Example Endpoints to Add (Optional)
- `POST /admin/rag/run-plan` – input: URLs/domain; runs Portia RAG update plan
- `POST /evidence/assistant` – input: case context; returns structured checklist and next steps
- `POST /appointments/triage` – input: free text; returns suggested specialization and slots

Each is isolated and does not touch the existing AI Court or chatbot routes.
