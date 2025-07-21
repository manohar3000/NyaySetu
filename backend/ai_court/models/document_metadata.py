from pydantic import BaseModel, Field
from typing import List, Optional

class DocumentMetadata(BaseModel):
    case_name: Optional[str] = None
    court: Optional[str] = None
    judgement_date: Optional[str] = None # Or datetime if parsed
    legal_principles: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list) # From your Qdrant image
    document_type: Optional[str] = None
    source_file: Optional[str] = None
    upload_date: Optional[str] = None # Or datetime if parsed
    page_label: Optional[str] = None # From LlamaIndex PDF loader
    chunk_number: Optional[int] = None
    total_chunks: Optional[int] = None
    original_text_length: Optional[int] = None
