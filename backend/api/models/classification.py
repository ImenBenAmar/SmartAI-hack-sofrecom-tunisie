"""
Pydantic models for document classification endpoints.
"""
from pydantic import BaseModel, Field
from typing import List

class ClassificationRequest(BaseModel):
    """Request model for document classification"""
    text_content: str = Field(..., description="Text content to classify")
    num_themes: int = Field(default=5, description="Number of themes to detect", ge=2, le=15)
    
    class Config:
        json_schema_extra = {
            "example": {
                "text_content": "This document discusses various aspects of agriculture, technology, and environmental sustainability...",
                "num_themes": 5
            }
        }

class ThemeInfo(BaseModel):
    """Information about a detected theme"""
    theme_id: int
    description: str
    representative_text: str

class ClassificationResponse(BaseModel):
    """Response model for document classification"""
    themes: List[ThemeInfo] = Field(..., description="List of detected themes")
    total_themes: int = Field(..., description="Total number of themes detected")
    total_chunks: int = Field(..., description="Total number of document chunks")
    processing_time_seconds: float = Field(..., description="Time taken to process")
    
    class Config:
        json_schema_extra = {
            "example": {
                "themes": [
                    {
                        "theme_id": 1,
                        "description": "Agriculture durable",
                        "representative_text": "Les pratiques agricoles durables incluent..."
                    },
                    {
                        "theme_id": 2,
                        "description": "Technologies innovantes",
                        "representative_text": "Les nouvelles technologies permettent..."
                    }
                ],
                "total_themes": 5,
                "total_chunks": 42,
                "processing_time_seconds": 8.45
            }
        }