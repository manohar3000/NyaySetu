from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.vector_stores.qdrant import QdrantVectorStore
from qdrant_client import AsyncQdrantClient
from dotenv import load_dotenv

from backend.ai_court.core.embedding import embedding_model
from backend.ai_court.core.qdrant_client import qdrant_client_instance
from backend.ai_court.core.config import settings

# Load environment variables at the very beginning
load_dotenv()

# --- LlamaIndex Settings Initialization (replaces ServiceContext) ---
Settings.embed_model = embedding_model
Settings.chunk_size = 1024  # You can make these configurable in settings.py
Settings.chunk_overlap = 200

# --- Custom Node Parser for legal documents ---
from llama_index.core.node_parser import SentenceSplitter

node_parser = SimpleNodeParser.from_defaults(
    chunk_size=Settings.chunk_size,
    chunk_overlap=Settings.chunk_overlap,
    include_metadata=True
)

# --- Initialize Async Qdrant Client ---
async_qdrant_client = AsyncQdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
    timeout=10
)

# --- Ensure collections exist ---
import asyncio

async def ensure_collections_exist():
    try:
        collections = await async_qdrant_client.get_collections()
        collection_names = [col.name for col in collections.collections]
        
        if settings.QDRANT_QNA_COLLECTION not in collection_names:
            await async_qdrant_client.create_collection(
                collection_name=settings.QDRANT_QNA_COLLECTION,
                vectors_config={"text-dense": {"size": 1024, "distance": "Cosine"}}
            )
            print(f"Created collection: {settings.QDRANT_QNA_COLLECTION}")
            
        if settings.QDRANT_CASE_COLLECTION not in collection_names:
            await async_qdrant_client.create_collection(
                collection_name=settings.QDRANT_CASE_COLLECTION,
                vectors_config={"text-dense": {"size": 1024, "distance": "Cosine"}}
            )
            print(f"Created collection: {settings.QDRANT_CASE_COLLECTION}")
            
    except Exception as e:
        print(f"Warning: Could not ensure collections exist: {e}")

# Run collection creation (this will be called during import)
try:
    asyncio.run(ensure_collections_exist())
except Exception as e:
    print(f"Warning: Could not create collections during import: {e}")

# --- Initialize Qdrant Vector Stores for LlamaIndex ---
legal_qna_vector_store = QdrantVectorStore(
    aclient=async_qdrant_client,
    collection_name=settings.QDRANT_QNA_COLLECTION,
    vector_name="text-dense"
)

case_law_vector_store = QdrantVectorStore(
    aclient=async_qdrant_client,
    collection_name=settings.QDRANT_CASE_COLLECTION,
    vector_name="text-dense"
)

# --- Initialize LlamaIndex VectorStoreIndex instances ---
legal_qna_index = VectorStoreIndex.from_vector_store(
    vector_store=legal_qna_vector_store
)

case_law_index = VectorStoreIndex.from_vector_store(
    vector_store=case_law_vector_store
)
