"""
Pydantic models for RAG question answering endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List

class RAGQuestionRequest(BaseModel):
    """Request model for RAG question answering"""
    question: str = Field(..., description="Question to answer")
    text_content: str = Field(..., description="Text content to search for answers")
    top_k: int = Field(default=3, description="Number of similar chunks to retrieve", ge=1, le=10)
    apply_correction: bool = Field(default=True, description="Apply correction step to the answer")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "Comment les agriculteurs irriguent-ils leurs cultures?",
                "text_content": "Les agriculteurs utilisent diverses méthodes d'irrigation...",
                "top_k": 3,
                "apply_correction": True
            }
        }

class RAGAnswerResponse(BaseModel):
    """Response model for RAG question answering"""
    question: str
    answer: str = Field(..., description="Final answer to the question")
    raw_answer: Optional[str] = Field(None, description="Raw answer before correction")
    context_chunks: List[str] = Field(..., description="Retrieved context chunks used")
    total_chunks: int = Field(..., description="Total number of document chunks")
    generation_time_seconds: float = Field(..., description="Time taken to generate answer")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "Comment les agriculteurs irriguent-ils leurs cultures?",
                "answer": "Les agriculteurs utilisent des systèmes d'irrigation goutte-à-goutte et des pompes solaires.",
                "raw_answer": "Les agriculteurs utilisent irrigation goutte-à-goutte et pompes solaires...",
                "context_chunks": [
                    "Les agriculteurs kényans utilisent des systèmes d'irrigation...",
                    "Les technologies d'irrigation incluent..."
                ],
                "total_chunks": 25,
                "generation_time_seconds": 2.34
            }
        }