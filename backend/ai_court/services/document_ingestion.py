import os
from datetime import datetime
from typing import Dict, Any, List
from dotenv import load_dotenv

from fastapi import UploadFile, HTTPException
from llama_index.core import SimpleDirectoryReader
from backend.ai_court.core.config import settings
from backend.ai_court.core.llama_index_setup import node_parser, case_law_vector_store
from backend.ai_court.services.metadata_extractor import extract_metadata_from_text_llm

# Load environment variables at the very beginning
load_dotenv()

async def ingest_document(file: UploadFile) -> Dict[str, Any]:
    """
    Handles the ingestion of a single legal document:
    1. Saves the file.
    2. Loads and chunks the document.
    3. Extracts comprehensive metadata using an LLM.
    4. Enriches nodes with metadata.
    5. Adds nodes to the Qdrant case law vector store.
    """
    file_location = os.path.join(settings.UPLOADS_DIR, file.filename)
    
    try:
        # Save uploaded file
        with open(file_location, "wb+") as file_object:
            content = await file.read()
            file_object.write(content)

        # Load document using LlamaIndex SimpleDirectoryReader
        documents = SimpleDirectoryReader(input_files=[file_location]).load_data()
        
        if not documents:
            raise HTTPException(status_code=400, detail="Could not load any documents from the file. Ensure it's a valid PDF/TXT.")

        # Extract comprehensive metadata for the entire document using LLM
        full_document_text = documents[0].text # Take first doc's text as representative
        document_metadata = extract_metadata_from_text_llm(full_document_text)
        # Add basic info if LLM didn't get it or if it's the source file name
        document_metadata['source_file'] = file.filename
        document_metadata['upload_date'] = datetime.now().isoformat()
        
        # Parse document into nodes with custom splitting
        nodes = node_parser.get_nodes_from_documents(documents, show_progress=False)
        
        # Enhance each node with combined metadata
        for i, node in enumerate(nodes):
            # Combine LlamaIndex's default metadata (like page_label) with the
            # extracted document-level metadata.
            node.metadata = {
                **node.metadata,
                **document_metadata, # Add document-level metadata to each chunk
                "chunk_number": i + 1,
                "total_chunks": len(nodes),
                "original_text_length": len(node.text)
            }
        
        # Add nodes directly to the Qdrant vector store (async)
        try:
            await case_law_vector_store.aadd(nodes)
        except Exception as e:
            print(f"Warning: Could not add nodes to vector store: {e}")
            # Continue without vector storage for now
        
        return {
            "message": "File processed and indexed successfully",
            "document_metadata": document_metadata,
            "num_chunks_indexed": len(nodes),
            "filename": file.filename
        }
    except Exception as e:
        # Clean up the file if an error occurs during processing
        if os.path.exists(file_location):
            os.remove(file_location)
        print(f"Error during document ingestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process and index file: {str(e)}")
