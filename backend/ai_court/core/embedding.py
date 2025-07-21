from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from dotenv import load_dotenv
from backend.ai_court.core.config import settings

# Load environment variables at the very beginning
load_dotenv()

def get_embedding_model():
    """Initializes and returns the HuggingFace embedding model."""
    try:
        model = HuggingFaceEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
        print(f"Embedding model '{settings.EMBEDDING_MODEL_NAME}' loaded successfully.")
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load embedding model: {e}")

embedding_model = get_embedding_model()
