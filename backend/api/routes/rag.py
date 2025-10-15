"""
Endpoints for Retrieval-Augmented Generation (RAG) question answering.
"""
from fastapi import APIRouter, HTTPException, Body
from api.models.rag import RAGQuestionRequest, RAGAnswerResponse
from modules.rag_processor import answer_question
import os
from dotenv import load_dotenv

# Charger explicitement le .env (si placé dans config/)
dotenv_path = os.path.join(os.path.dirname(__file__), '../../config/.env')
load_dotenv(dotenv_path)
# Vérifie que les clés sont bien chargées
print("CLOUD_ADAPTER_API_KEY :", os.getenv("CLOUD_ADAPTER_API_KEY"))
router = APIRouter()

# API Keys for external services
MISTRAL_API_ENDPOINT = os.environ.get("CLOUD_ADAPTER_ENDPOINT", "https://api.mistral.ai")
MISTRAL_API_KEY = os.environ.get("CLOUD_ADAPTER_API_KEY", "")
MISTRAL_MODEL = os.environ.get("MISTRAL_MODEL", "mistral-small")

@router.post("/rag/ask", response_model=RAGAnswerResponse)
def rag_question_answering(
    request: RAGQuestionRequest = Body(..., description="Question and context for RAG")
) -> RAGAnswerResponse:
    """
    Answer questions using Retrieval-Augmented Generation (RAG).
    Supports document vectorization and context-aware answers.
    """
    if not MISTRAL_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Mistral API key not configured. Please set CLOUD_ADAPTER_API_KEY in environment or .env file."
        )
    
    try:
        print(f"INFO: Processing RAG question: {request.question[:50]}...")
        result = answer_question(
            question=request.question,
            text_content=request.text_content,
            api_endpoint=MISTRAL_API_ENDPOINT,
            api_key=MISTRAL_API_KEY,
            model=MISTRAL_MODEL,
            top_k=request.top_k,
            apply_correction=request.apply_correction
        )
        
        print(f"INFO: RAG answer generated successfully")
        return RAGAnswerResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: RAG processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"RAG processing failed: {str(e)}"
        )
