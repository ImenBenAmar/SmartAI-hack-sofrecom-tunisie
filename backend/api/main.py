"""
Main entry point for the Email Processing API.
Initializes FastAPI app and startup event.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import email, attachment, rag, classification, calendar, system
import uvicorn
import os
from dotenv import load_dotenv

# Chemin absolu vers le .env
dotenv_path = os.path.join(os.path.dirname(__file__), '../config/.env')
load_dotenv(dotenv_path)

# Vérifie que les clés sont bien chargées
print("NVIDIA_API_KEY_LLAMA3_8B:", os.getenv("NVIDIA_API_KEY_LLAMA3_8B"))
print("NVIDIA_API_KEY_LLAMA3_70B:", os.getenv("NVIDIA_API_KEY_LLAMA3_70B"))

# Constants
TRANSLATION_CACHE_DIR = "translation_cache"

# Create FastAPI app
app = FastAPI(
    title="📧 Email Processing API",
    description="Advanced email processing with translation, semantic analysis, and task detection",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(system.router, prefix="")
app.include_router(email.router, prefix="/api")
app.include_router(attachment.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(classification.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("=" * 60)
    print("📧 Email Processing API Starting...")
    print("=" * 60)
    
    # Create cache directory if it doesn't exist
    os.makedirs(TRANSLATION_CACHE_DIR, exist_ok=True)
    print(f"✅ Translation cache directory: {TRANSLATION_CACHE_DIR}")
    
    from modules.llm_client import MODEL_FOR_TRANSLATION, MODEL_FOR_SEMANTICS
    print(f"✅ Translation model: {MODEL_FOR_TRANSLATION}")
    print(f"✅ Semantic analysis model: {MODEL_FOR_SEMANTICS}")
    
    # Feature availability status
    from modules import calendar_service, attachment_processor, rag_processor, classification_processor
    print("\n" + "=" * 60)
    print("🔌 INTEGRATIONS STATUS")
    print("=" * 60)
    
    try:
        calendar_service.get_calendar_service
        print(f"✅ Calendar integration: Enabled")
    except:
        print(f"⚠️  Calendar integration: Disabled (module not found)")
    
    try:
        attachment_processor.process_file_bytes
        print(f"✅ Attachment processing: Enabled")
    except:
        print(f"⚠️  Attachment processing: Disabled (install: pytesseract, python-docx, opencv-python)")
    
    try:
        rag_processor.answer_question
        print(f"✅ RAG Q&A: Enabled")
    except:
        print(f"⚠️  RAG Q&A: Disabled (install: langchain, chromadb, sentence-transformers)")
    
    try:
        classification_processor.classify_document
        print(f"✅ Document classification: Enabled")
    except:
        print(f"⚠️  Document classification: Disabled (install: scikit-learn, langchain, chromadb)")
    
    print("=" * 60)
    print("🚀 API Ready! Visit /docs for interactive documentation")
    print("=" * 60)

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 Starting Email Processing API Server...")
    print("=" * 60)
    print("\n📖 Documentation available at: http://127.0.0.1:8002/docs")
    print("\n🔍 See / for full endpoint listing")
    print("\n" + "=" * 60 + "\n")
    
    uvicorn.run(
        "api.main:app",
        host="127.0.0.1",
        port=8002,
        reload=True,
        log_level="info"
    )