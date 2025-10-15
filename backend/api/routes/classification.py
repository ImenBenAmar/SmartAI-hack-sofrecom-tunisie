"""
Endpoints for document classification and theme detection.
"""
from fastapi import APIRouter, HTTPException, Body
from api.models.classification import ClassificationRequest, ClassificationResponse, ThemeInfo
from modules.classification_processor import classify_document
import os

router = APIRouter()

# API Keys for external services
MISTRAL_API_ENDPOINT = os.environ.get("CLOUD_ADAPTER_ENDPOINT", "https://api.mistral.ai")
MISTRAL_API_KEY = os.environ.get("CLOUD_ADAPTER_API_KEY", "")
MISTRAL_MODEL = os.environ.get("MISTRAL_MODEL", "mistral-small")

@router.post("/classification/themes", response_model=ClassificationResponse)
def classify_document_themes(
    request: ClassificationRequest = Body(..., description="Document to classify")
) -> ClassificationResponse:
    """
    Detect and classify document themes using ML clustering.
    """
    if not MISTRAL_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Mistral API key not configured. Please set CLOUD_ADAPTER_API_KEY in environment or .env file."
        )
    
    try:
        print(f"INFO: Starting document classification with {request.num_themes} themes")
        result = classify_document(
            text_content=request.text_content,
            api_endpoint=MISTRAL_API_ENDPOINT,
            api_key=MISTRAL_API_KEY,
            model=MISTRAL_MODEL,
            num_themes=request.num_themes
        )
        
        print(f"INFO: Classification completed successfully")
        themes = [ThemeInfo(**theme) for theme in result["themes"]]
        return ClassificationResponse(
            themes=themes,
            total_themes=result["total_themes"],
            total_chunks=result["total_chunks"],
            processing_time_seconds=result["processing_time_seconds"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Classification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}"
        )