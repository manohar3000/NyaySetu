from typing import Dict, Any
from fastapi import HTTPException

from llama_index.core import VectorStoreIndex

class LegalQueryEngine:
    def __init__(self, index: VectorStoreIndex):
        self.index = index
        # Using as_retriever to get raw nodes, not summary from LlamaIndex's built-in LLM
        self.retriever = index.as_retriever(similarity_top_k=5)
        
    async def aquery(self, query: str) -> Dict[str, Any]:
        """
        Performs an asynchronous query on the LlamaIndex VectorStoreIndex
        and returns the raw source nodes with their metadata.
        """
        try:
            nodes = await self.retriever.aretrieve(query)
            
            source_docs = []
            for node_with_score in nodes:
                node = node_with_score.node
                source_doc = {
                    "text": node.text,
                    "score": node_with_score.score,
                    "metadata": node.metadata # Contains all extracted metadata from Qdrant payload
                }
                source_docs.append(source_doc)
            
            return {
                "response": "Documents retrieved for context.",
                "sources": source_docs
            }
            
        except Exception as e:
            print(f"Error during Qdrant retrieval: {e}")
            # Return empty results instead of failing completely
            return {
                "response": "No relevant documents found in database.",
                "sources": []
            }

# Initialize query engines using the setup from llama_index_setup
from backend.ai_court.core.llama_index_setup import legal_qna_index, case_law_index

qna_query_engine = LegalQueryEngine(legal_qna_index)
case_query_engine = LegalQueryEngine(case_law_index)
