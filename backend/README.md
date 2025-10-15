# Email Processing API

## Overview
The **Email Processing API** is a FastAPI-based backend application designed to automate email processing tasks. It provides advanced features including email translation, semantic analysis, task detection, auto-reply generation, attachment processing, retrieval-augmented generation (RAG) for question answering, document classification, and Google Calendar integration. The API supports multiple language models (e.g., NVIDIA Llama 3, Mistral) and is built to be extensible for enterprise email automation workflows.

This project is part of the `projet_email_automation` repository, with the backend located in the `backend/` directory. It integrates with a frontend application (assumed to be in `frontend/`), serving the favicon from `frontend/src/app/favicon.ico`.

## Features
- **Email Translation**: Translates email subject and body to English using NVIDIA Llama 3 or Mistral models.
- **Semantic Analysis**: Analyzes email intent and tone.
- **Task Detection**: Extracts tasks from email content.
- **Auto-Reply Generation**: Generates automated email responses.
- **Attachment Processing**: Extracts text from text files, images (via OCR), and documents (e.g., .docx, .pdf).
- **RAG Question Answering**: Answers questions based on provided context using a vector store (ChromaDB).
- **Document Classification**: Identifies themes in documents using machine learning.
- **Google Calendar Integration**: Checks availability, schedules events, and analyzes calendar data.
- **Health Checks**: Monitors API status and model availability.
- **Database Management**: Clears RAG and classification vector stores.

## Project Structure
```
backend/
├── api/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── system.py        # System endpoints (root, health, favicon, database clearing)
│   │   ├── email.py         # Email processing endpoints (translate, analyze, etc.)
│   │   ├── attachment.py    # Attachment processing endpoints
│   │   ├── rag.py           # RAG question answering endpoints
│   │   ├── classification.py # Document classification endpoints
│   │   ├── calendar.py      # Google Calendar integration endpoints
├── config/
│   ├── .env                # Environment variables (API keys, model configs)
│   ├── client_secret.json  # Google Calendar API credentials
├── modules/
│   ├── __init__.py
│   ├── llm_client.py       # Language model client (NVIDIA, Mistral, local Llama)
│   ├── calendar_service.py # Google Calendar service integration
│   ├── attachment_processor.py # Attachment processing logic
│   ├── rag_processor.py    # RAG question answering logic
│   ├── classification_processor.py # Document classification logic
│   ├── language.py         # Language detection and translation utilities
│   ├── processing.py       # Email analysis utilities (semantics, tasks, replies)
├── static/                 # Optional static files directory
├── tests/
│   ├── test_pipeline.py    # Test scripts for API endpoints
├── translation_cache/      # Cache directory for translation results
├── chroma_db_api/         # RAG vector store (ChromaDB)
├── chroma_db_classification/ # Classification vector store (ChromaDB)
```

## Requirements
- Python 3.8+
- Tesseract OCR (for image attachment processing)
  - Install: [Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
  - Set path in `modules/attachment_processor.py`:
    ```python
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    ```

### Python Dependencies
Install required packages:
```bash
pip install fastapi uvicorn pytesseract python-docx opencv-python google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client langchain chromadb sentence-transformers scikit-learn python-dotenv openai
```

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd projet_email_automation/backend
   ```

2. **Set Up Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate     # Windows
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or install manually:
   ```bash
   pip install fastapi uvicorn pytesseract python-docx opencv-python google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client langchain chromadb sentence-transformers scikit-learn python-dotenv openai
   ```

4. **Configure Environment Variables**:
   - Create/edit `config/.env`:
     ```env
     NVIDIA_API_KEY_LLAMA3_8B=your_nvidia_api_key_8b
     NVIDIA_API_KEY_LLAMA3_70B=your_nvidia_api_key_70b
     CLOUD_ADAPTER_API_KEY=your_mistral_api_key
     MISTRAL_MODEL=mistral-small
     LOCAL_LLAMA_API_BASE_URL=http://localhost:11434
     LOCAL_LLAMA_MODEL_NAME=llama3
     ```
   - Replace `your_nvidia_api_key_8b`, `your_nvidia_api_key_70b`, and `your_mistral_api_key` with actual keys.

5. **Configure Google Calendar**:
   - Obtain `client_secret.json` from [Google Cloud Console](https://console.cloud.google.com/).
   - Place it in `config/client_secret.json`.
   - Ensure Google Calendar API is enabled.

6. **Run the API**:
   ```bash
   uvicorn api.main:app --host 127.0.0.1 --port 8002 --reload
   ```
   - Access Swagger UI: `http://127.0.0.1:8002/docs`
   - Root endpoint: `http://127.0.0.1:8002/`

## API Endpoints
The API provides the following endpoints, accessible via `http://127.0.0.1:8002/docs` for interactive testing.

### System Endpoints
- **GET /**: Returns API information, version, and available endpoints.
  - Response: `{ "message": "📧 Email Processing API - Powered by FastAPI", "version": "2.0.0", "integrations": {...}, "endpoints": {...} }`
- **GET /health**: Checks API health and translation model.
  - Response: `{ "status": "healthy", "service": "email-processing-api", "translation_model": "meta/llama3-8b-instruct" }`
- **GET /favicon.ico**: Serves favicon from `frontend/src/app/favicon.ico`.
  - Response: Favicon image or `{ "message": "Favicon not found" }`
- **POST /api/database/clear-rag**: Clears RAG vector store.
  - Response: `{ "message": "RAG database cleared successfully", "deleted": true, "folder_path": "chroma_db_api" }`
- **POST /api/database/clear-classification**: Clears classification vector store.
  - Response: `{ "message": "Classification database cleared successfully", "deleted": true, "folder_path": "chroma_db_classification" }`
- **POST /api/database/clear-all**: Clears both RAG and classification vector stores.
  - Response: `{ "message": "Successfully cleared 2 database(s)", "rag_deleted": true, "classification_deleted": true, "deleted_count": 2 }`

### Email Processing Endpoints
- **POST /api/translate**: Translates email subject and message to English using Llama 3.
  - Request: `{ "subject": "Réunion demain", "message": "Bonjour." }`
  - Response: `{ "subject": "Meeting tomorrow", "message": "Hello.", "detected_language": "French" }`
- **POST /api/translate/mistral**: Translates using Mistral model.
  - Request: Same as above.
  - Response: Same as above.
- **POST /api/analyze**: Analyzes email semantics, summary, tasks, and generates auto-reply.
  - Request: `{ "subject": "Meeting", "message": "Please schedule a meeting for tomorrow." }`
  - Response: `{ "subject": "Meeting", "message": "...", "detected_language": "English", "semantics": {...}, "summary": "...", "tasks": [...], "auto_reply": "..." }`
- **POST /api/summary**: Summarizes email content.
  - Request: `{ "subject": "Meeting", "message": "Please schedule a meeting for tomorrow at 10 AM." }`
  - Response: `{ "summary": "Request to schedule a meeting for tomorrow at 10 AM." }`
- **POST /api/tasks**: Detects tasks in email.
  - Request: `{ "subject": "Meeting", "message": "Please schedule a meeting and send the report." }`
  - Response: `{ "tasks": ["Schedule a meeting", "Send the report"] }`
- **POST /api/reply**: Generates an auto-reply.
  - Request: `{ "subject": "Meeting", "message": "Please schedule a meeting." }`
  - Response: `{ "auto_reply": "Thank you for your email. I’ll schedule the meeting." }`

### Attachment Processing
- **POST /api/attachment/process**: Processes attachments (text, images, documents).
  - Request: `{ "filename": "test.txt", "file_content_base64": "aGVsbG8gd29ybGQ=" }`
  - Response: `{ "text": "hello world", "metadata": { "filename": "test.txt", "type": "text" } }`
  - Supported formats: `.txt`, `.docx`, `.jpg`, `.png`, `.pdf`

### RAG Question Answering
- **POST /api/rag/ask**: Answers questions using context and vector store.
  - Request: `{ "question": "What is the meeting about?", "context": "The meeting is about project updates." }`
  - Response: `{ "answer": "The meeting is about project updates." }`

### Document Classification
- **POST /api/classification/themes**: Classifies document themes.
  - Request: `{ "text": "Discuss project updates." }`
  - Response: `{ "themes": ["project_management"] }`

### Google Calendar Integration
- **GET /api/calendar/availability**: Checks calendar availability.
  - Response: `{ "availability": [...] }`
- **POST /api/calendar/schedule**: Schedules a calendar event.
  - Request: `{ "start_time": "2025-10-13T10:00:00", "end_time": "2025-10-13T11:00:00", "summary": "Project Meeting" }`
  - Response: `{ "message": "Event scheduled", "event_id": "..." }`
- **POST /api/calendar/analyze**: Analyzes calendar events.
  - Request: `{ "event_description": "Project meeting to discuss updates." }`
  - Response: `{ "analysis": {...} }`

## Testing
1. **Interactive Testing**:
   - Access Swagger UI at `http://127.0.0.1:8002/docs`.
   - Click “Try it out” for each endpoint, enter request bodies, and execute to verify responses.

2. **Manual Testing with curl**:
   - Example for `/api/translate`:
     ```bash
     curl -X POST http://127.0.0.1:8002/api/translate -H "Content-Type: application/json" -d '{"subject": "Réunion demain", "message": "Bonjour."}'
     ```
   - Example for `/api/attachment/process`:
     - Encode "hello world" to base64 in PowerShell:
       ```powershell
       [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("hello world"))
       ```
       Output: `aGVsbG8gd29ybGQ=`
     - Run:
       ```bash
       curl -X POST http://127.0.0.1:8002/api/attachment/process -H "Content-Type: application/json" -d '{"filename": "test.txt", "file_content_base64": "aGVsbG8gd29ybGQ="}'
       ```

3. **Automated Testing**:
   - Use `tests/test_pipeline.py`:
     ```bash
     python tests/test_pipeline.py
     ```
   - Example test script:
     ```python
     from fastapi.testclient import TestClient
     from api.main import app

     client = TestClient(app)

     def test_translate():
         response = client.post("/api/translate", json={
             "subject": "Réunion demain",
             "message": "Bonjour."
         })
         assert response.status_code == 200
         assert "detected_language" in response.json()
     ```

## Troubleshooting
- **404 Not Found**:
  - Verify the endpoint exists in the corresponding route file (e.g., `routes/email.py`, `routes/calendar.py`).
  - Check `main.py` for correct router inclusion.
- **500 Internal Server Error**:
  - Check Uvicorn logs for details.
  - Ensure API keys in `config/.env` are valid.
  - Verify dependencies are installed and Tesseract path is set.
- **401/403 for Calendar**:
  - Ensure `config/client_secret.json` is valid and Google Calendar API is enabled.
- **Base64 Encoding on Windows**:
  - Use PowerShell:
    ```powershell
    [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("hello world"))
    ```
  - Output: `aGVsbG8gd29ybGQ=`

## Frontend Integration
The backend serves the favicon from `frontend/src/app/favicon.ico` via `GET /favicon.ico`. For frontend integration:
- Update CORS in `main.py` to allow the frontend URL (e.g., `http://localhost:3000`).
- Configure the frontend (e.g., React, Angular) to serve `favicon.ico` for its pages.
- Example for React:
  - Move `favicon.ico` to `frontend/public/`.
  - Update `frontend/public/index.html`:
    ```html
    <link rel="icon" href="/favicon.ico" />
    ```

## Contributing
- Add new endpoints to `routes/` and update `system.py` to include them in the root endpoint.
- Ensure tests in `tests/` cover new functionality.
- Submit pull requests with detailed descriptions.

## License
This project is licensed under the MIT License.