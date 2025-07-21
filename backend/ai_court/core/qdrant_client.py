import qdrant_client
from dotenv import load_dotenv
from backend.ai_court.core.config import settings

# Load environment variables at the very beginning
load_dotenv()

def get_qdrant_client():
    """Initializes and returns the Qdrant client instance."""
    try:
        qdrant_client_instance = qdrant_client.QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            timeout=10,
            prefer_grpc=True
        )
        
        # Test connection
        qdrant_client_instance.get_collections()
        print("Successfully connected to Qdrant cloud instance.")
        return qdrant_client_instance
    except Exception as e:
        raise RuntimeError(f"Failed to connect to Qdrant: {e}. Please check QDRANT_API_KEY and URL.")

qdrant_client_instance = get_qdrant_client()
