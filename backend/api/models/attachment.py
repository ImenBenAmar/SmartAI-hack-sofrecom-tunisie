"""
Pydantic models for attachment processing endpoints.
"""
from pydantic import BaseModel, Field

class AttachmentProcessRequest(BaseModel):
    """Request model for processing file attachments"""
    filename: str = Field(..., description="Original filename with extension")
    file_content_base64: str = Field(..., description="Base64-encoded file content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "filename": "document.pdf",
                "file_content_base64": "JVBERi0xLjQKJeLj..."
            }
        }

class AttachmentMetadata(BaseModel):
    """Metadata for processed attachment"""
    filename: str
    size_kb: float
    mime_type: str
    extension: str
    created_date: str
    modified_date: str

class AttachmentProcessResponse(BaseModel):
    """Response model for attachment processing"""
    metadata: AttachmentMetadata
    extracted_text: str = Field(..., description="Text extracted from the file")
    text_length: int = Field(..., description="Length of extracted text")
    processing_successful: bool = Field(..., description="Whether processing was successful")
    
    class Config:
        json_schema_extra = {
            "example": {
                "metadata": {
                    "filename": "document.pdf",
                    "size_kb": 245.67,
                    "mime_type": "pdf",
                    "extension": ".pdf",
                    "created_date": "2025-10-07T10:30:00",
                    "modified_date": "2025-10-07T10:30:00"
                },
                "extracted_text": "This is the extracted text from the document...",
                "text_length": 1523,
                "processing_successful": True
            }
        }