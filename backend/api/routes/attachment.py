"""
Endpoints for processing file attachments.
"""
from fastapi import APIRouter, HTTPException, Body
from api.models.attachment import AttachmentProcessRequest, AttachmentProcessResponse, AttachmentMetadata
from modules.attachment_processor import process_file_bytes, is_supported_file, get_supported_extensions
import base64

router = APIRouter()

@router.post("/attachment/process", response_model=AttachmentProcessResponse)
def process_attachment(
    request: AttachmentProcessRequest = Body(..., description="File attachment to process")
) -> AttachmentProcessResponse:
    """
    Process file attachments and extract text content.
    Supports PDF, DOCX, images (PNG, JPG, JPEG), TXT, and PPTX.
    """
    print("=" * 80)
    print("📎 ATTACHMENT PROCESSING REQUEST RECEIVED")
    print("=" * 80)
    
    try:
        print(f"Request filename: {request.filename}")
        print(f"Base64 content length: {len(request.file_content_base64)} characters")
        
        if not is_supported_file(request.filename):
            print(f"ERROR: Unsupported file type: {request.filename}")
            supported_exts = get_supported_extensions()
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Supported extensions: {', '.join(supported_exts)}"
            )
        
        print(f"✓ File type is supported")
        print(f"Decoding base64 content...")
        try:
            file_bytes = base64.b64decode(request.file_content_base64)
            print(f"✓ Base64 decoded successfully: {len(file_bytes)} bytes")
        except Exception as e:
            print(f"ERROR: Failed to decode base64: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid base64 encoding: {str(e)}"
            )
        
        print(f"Processing file bytes...")
        metadata, output_path, extracted_text = process_file_bytes(
            file_bytes,
            request.filename,
            save_output=False
        )
        
        if metadata is None:
            print(f"ERROR: process_file_bytes returned None for metadata")
            raise HTTPException(
                status_code=400,
                detail="Failed to process file"
            )
        
        print(f"✓ File processed successfully")
        print(f"Metadata: {metadata}")
        print(f"Extracted text length: {len(extracted_text)} characters")
        
        print(f"Building response...")
        response = AttachmentProcessResponse(
            metadata=AttachmentMetadata(**metadata),
            extracted_text=extracted_text,
            text_length=len(extracted_text),
            processing_successful=True
        )
        
        print(f"✅ ATTACHMENT PROCESSING COMPLETED SUCCESSFULLY")
        print("=" * 80)
        return response
        
    except HTTPException as http_exc:
        print(f"HTTP Exception: {http_exc.status_code} - {http_exc.detail}")
        print("=" * 80)
        raise
    except Exception as e:
        print(f"ERROR: Unexpected error during attachment processing: {str(e)}")
        print("=" * 80)
        raise HTTPException(
            status_code=500,
            detail=f"Attachment processing failed: {str(e)}"
        )