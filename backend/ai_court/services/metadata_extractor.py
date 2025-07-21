import re
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
# If you decide to use LLMs for extraction
from backend.ai_court.core.llm import gemini_model
from google.generativeai.types import GenerationConfig
import json # For JSON mode output

# Load environment variables at the very beginning
load_dotenv()

def extract_metadata_from_text_llm(text: str) -> Dict[str, Any]:
    """
    Extracts structured metadata from a legal text using an LLM in JSON mode.
    This is the recommended "expert" way for robustness.
    """
    if gemini_model is None:
        print("Warning: Gemini model not initialized for metadata extraction. Falling back to simple default.")
        return {}

    prompt = f"""
    Analyze the following legal document text and extract the following metadata in JSON format.
    Be precise and thorough. If a field is not found, use null or an empty array.

    Metadata Fields to Extract:
    - case_name (e.g., "Smith v. Jones")
    - court (e.g., "Supreme Court", "High Court")
    - judgement_date (e.g., "15 July 2023", "2023-07-15" - prefer YYYY-MM-DD if possible)
    - legal_principles (list of key legal principles or ratios)
    - citations (list of cited acts, sections, articles, or major case citations like "Indian Penal Code, 1860 Section 302")
    - document_type (e.g., "Judgment/Order", "Pleading", "Affidavit", "Bail Application")
    - tags (list of keywords or important legal concepts)

    Example JSON Output:
    {{
      "case_name": "Rameshwar Bhartia vs. Respondent",
      "court": "Supreme Court",
      "judgement_date": "1951-10-23",
      "legal_principles": ["Sanction for prosecution", "Personal interest of Magistrate"],
      "citations": ["Criminal Procedure Code", "Section 556 CrPC", "Section 514 CrPC"],
      "document_type": "Judgment/Order",
      "tags": ["Criminal Appeal", "Forfeiture of bond", "Sentence enhancement"]
    }}

    Legal Document Text:
    ---
    {text[:5000]} # Limit text length to fit context window
    ---

    Your JSON output:
    """
    
    try:
        # Use generate_content with a specific format instruction for JSON
        response = gemini_model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json", # Use JSON mode if available and stable
                temperature=0.1, # Keep low for factual extraction
                max_output_tokens=1024
            )
        )
        # Attempt to parse the response text as JSON
        extracted_data = json.loads(response.text)
        return extracted_data
    except Exception as e:
        print(f"Error extracting metadata with LLM: {e}. Falling back to empty dict.")
        return {}
