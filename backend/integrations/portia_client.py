"""
Lightweight optional integration with Portia Labs AI.
Does NOT change existing AI Court or chatbot flows.

- Requires Python >=3.11 for the SDK.
- Enable by setting environment variable PORTIA_ENABLED=true
- Uses Gemini via your existing GOOGLE_API_KEY.

Safe to import anywhere; if SDK or env not present, functions will no-op with clear errors.
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

PORTIA_ENABLED = os.getenv("PORTIA_ENABLED", "false").lower() in {"1", "true", "yes"}
PORTIA_DEFAULT_MODEL = os.getenv("PORTIA_DEFAULT_MODEL", "gemini-2.5-flash")

# Best-effort import; guard at runtime
try:
    if PORTIA_ENABLED:
        from portia import Portia  # type: ignore
    else:
        Portia = None  # type: ignore
except Exception:  # pragma: no cover
    Portia = None  # type: ignore


class PortiaUnavailable(RuntimeError):
    pass


def _ensure_available() -> None:
    if not PORTIA_ENABLED:
        raise PortiaUnavailable("PORTIA_ENABLED is false; enable by setting PORTIA_ENABLED=true in environment.")
    if Portia is None:
        raise PortiaUnavailable(
            "Portia SDK not available. Install with: pip install 'portia-sdk-python[google]' and ensure Python >= 3.11"
        )
    if not os.getenv("GOOGLE_API_KEY"):
        # Portia can work with multiple LLMs; we default to Gemini per project setup
        raise PortiaUnavailable("GOOGLE_API_KEY not set. Add it to your environment to use Portia with Gemini.")


def get_client(**kwargs: Any):
    """Create and return a Portia client instance.

    kwargs may include model overrides, tool configs, etc.
    """
    _ensure_available()
    # The Portia() constructor accepts configuration via env; pass through overrides if provided
    return Portia(**kwargs)


def generate_plan(query: str, context: Optional[Dict[str, Any]] = None, **kwargs: Any) -> Any:
    """Generate a Portia plan for a complex, multi-step task.

    Example tasks:
    - Crawl a list of URLs, extract legal text, summarize, and store results
    - Prepare materials for RAG ingestion
    - Research a statute and produce a structured brief
    """
    _ensure_available()
    client = get_client(default_model=PORTIA_DEFAULT_MODEL, **kwargs)
    # In Portia docs, Portia().plan(query) returns a Plan object
    plan = client.plan(query=query, context=context or {})
    return plan


def execute_plan(plan: Any, **kwargs: Any) -> Any:
    """Execute a previously generated Portia plan and return results/logs."""
    _ensure_available()
    client = get_client(default_model=PORTIA_DEFAULT_MODEL, **kwargs)
    # Plans are executable via plan.run() or client.run(plan)
    try:
        return plan.run()
    except AttributeError:
        return client.run(plan)


def run_one_shot(query: str, context: Optional[Dict[str, Any]] = None, **kwargs: Any) -> Any:
    """Convenience helper: generate + execute a plan in one call."""
    plan = generate_plan(query, context=context, **kwargs)
    return execute_plan(plan, **kwargs)
