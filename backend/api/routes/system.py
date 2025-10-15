"""
System endpoints for API information and health checks.
"""
from fastapi import APIRouter
from modules import calendar_service, attachment_processor, rag_processor, classification_processor
import os

router = APIRouter()

@router.get("/")

def root():
    """Root endpoint - API information"""
    calendar_status = "✅ Available" if hasattr(calendar_service, 'get_calendar_service') else "❌ Not Available"
    attachment_status = "✅ Available" if hasattr(attachment_processor, 'process_file_bytes') else "❌ Not Available"
    rag_status = "✅ Available" if hasattr(rag_processor, 'answer_question') else "❌ Not Available"
    classification_status = "✅ Available" if hasattr(classification_processor, 'classify_document') else "❌ Not Available"
    
    endpoints = {
        "translation": "/api/translate",
        "semantic_analysis": "/api/analyze",
        "summary": "/api/summary",
        "task_detection": "/api/tasks",
        "auto_reply": "/api/reply",
        "docs": "/docs",
        "health": "/health"
    }
    
    
    if hasattr(attachment_processor, 'process_file_bytes'):
        endpoints["attachment_processing"] = "/api/attachment/process"
    
    if hasattr(rag_processor, 'answer_question'):
        endpoints["rag_question_answering"] = "/api/rag/ask"
        endpoints["clear_rag_database"] = "/api/database/clear-rag"
    
    if hasattr(classification_processor, 'classify_document'):
        endpoints["document_classification"] = "/api/classification/themes"
        endpoints["clear_classification_database"] = "/api/database/clear-classification"
    
    if hasattr(rag_processor, 'answer_question') or hasattr(classification_processor, 'classify_document'):
        endpoints["clear_all_databases"] = "/api/database/clear-all"
    
    if hasattr(calendar_service, 'get_calendar_service'):
        endpoints["calendar_availability"] = "/api/calendar/availability"
        endpoints["calendar_schedule"] = "/api/calendar/schedule"
        endpoints["calendar_analyze"] = "/api/calendar/analyze"
    
    return {
        "message": "📧 Email Processing API - Powered by FastAPI",
        "version": "2.0.0",
        "integrations": {
            "calendar": calendar_status,
            "attachment_processing": attachment_status,
            "rag_qa": rag_status,
            "classification": classification_status
        },
        "endpoints": endpoints
    }
    


@router.get("/health")
def health_check():
    """Health check endpoint"""
    from modules.llm_client import MODEL_FOR_TRANSLATION
    return {
        "status": "healthy",
        "service": "email-processing-api",
        "translation_model": MODEL_FOR_TRANSLATION
    }

@router.post("/database/clear-rag")
def clear_rag_database():
    """Clear the RAG vectorstore database (Chroma DB)."""
    import shutil
    import os
    
    try:
        db_folder = "chroma_db_api"
        db_path = os.path.join(os.getcwd(), db_folder)
        
        if os.path.exists(db_path):
            print(f"Deleting RAG database: {db_path}")
            shutil.rmtree(db_path)
            return {
                "message": "RAG database cleared successfully",
                "deleted": True,
                "folder_path": db_folder
            }
        else:
            print(f"⚠️ Folder does not exist: {db_path}")
            return {
                "message": "RAG database folder does not exist (already cleared)",
                "deleted": False,
                "folder_path": db_folder
            }
    
    except PermissionError as e:
        print(f"❌ Permission denied: {e}")
        raise HTTPException(
            status_code=403,
            detail=f"Permission denied: Cannot delete database folder."
        )
    except Exception as e:
        print(f"❌ Error deleting database: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear database: {str(e)}"
        )

@router.post("/database/clear-classification")
def clear_classification_database():
    """Clear the Classification vectorstore database (Chroma DB)."""
    import shutil
    import os
    
    try:
        db_folder = "chroma_db_classification"
        db_path = os.path.join(os.getcwd(), db_folder)
        
        if os.path.exists(db_path):
            print(f"Deleting Classification database: {db_path}")
            shutil.rmtree(db_path)
            return {
                "message": "Classification database cleared successfully",
                "deleted": True,
                "folder_path": db_folder
            }
        else:
            print(f"⚠️ Folder does not exist: {db_path}")
            return {
                "message": "Classification database folder does not exist (already cleared)",
                "deleted": False,
                "folder_path": db_folder
            }
    
    except PermissionError as e:
        print(f"❌ Permission denied: {e}")
        raise HTTPException(
            status_code=403,
            detail=f"Permission denied: Cannot delete database folder."
        )
    except Exception as e:
        print(f"❌ Error deleting database: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear database: {str(e)}"
        )

@router.post("/database/clear-all")
def clear_all_databases():
    """Clear all vectorstore databases (RAG and Classification)."""
    import shutil
    import os
    
    try:
        results = {
            "message": "All databases cleared",
            "rag_deleted": False,
            "classification_deleted": False,
            "deleted_count": 0
        }
        
        rag_folder = "chroma_db_api"
        rag_path = os.path.join(os.getcwd(), rag_folder)
        
        if os.path.exists(rag_path):
            print(f"Deleting RAG database: {rag_path}")
            shutil.rmtree(rag_path)
            results["rag_deleted"] = True
            results["deleted_count"] += 1
        
        classif_folder = "chroma_db_classification"
        classif_path = os.path.join(os.getcwd(), classif_folder)
        
        if os.path.exists(classif_path):
            print(f"Deleting Classification database: {classif_path}")
            shutil.rmtree(classif_path)
            results["classification_deleted"] = True
            results["deleted_count"] += 1
        
        if results["deleted_count"] > 0:
            results["message"] = f"Successfully cleared {results['deleted_count']} database(s)"
        else:
            results["message"] = "No databases found to clear (already cleared)"
        
        return results
    
    except PermissionError as e:
        print(f"❌ Permission denied: {e}")
        raise HTTPException(
            status_code=403,
            detail=f"Permission denied: Cannot delete database folders."
        )
    except Exception as e:
        print(f"❌ Error deleting databases: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear databases: {str(e)}"
        )