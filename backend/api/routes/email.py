"""
Email processing endpoints for translation, analysis, summarization, task detection, and auto-reply.
"""
from fastapi import APIRouter, HTTPException, Body
from api.models.email import (
    TranslationRequest, TranslationResponse,
    SemanticAnalysisRequest, SemanticAnalysisResponse,
    SummaryRequest, SummaryResponse,
    TaskDetectionRequest, TaskDetectionResponse,
    AutoReplyRequest, AutoReplyResponse,
    Task, UrgencyInfo
)
from api.utils.language import detect_language, translate_text_to_english
from api.utils.processing import analyze_email_semantics, summarize_email, detect_tasks, generate_auto_reply

router = APIRouter()

@router.post("/translate", response_model=TranslationResponse)
def translate_email(
    request: TranslationRequest = Body(..., description="Email subject and message to translate")
) -> TranslationResponse:
    """
    Translate email subject and message to English.
    Detects language and uses caching for performance.
    """
    try:
        combined_text = f"{request.subject}\n{request.message}"
        detected_language, is_french = detect_language(combined_text)
        
        print(f"INFO: Detected language: {detected_language}")
        
        subject_translated = None
        message_translated = None
        
        if is_french:
            print("INFO: French detected - translating to English")
            subject_translated = translate_text_to_english(request.subject)
            message_translated = translate_text_to_english(request.message)
            print(f"INFO: Translation completed")
        else:
            print("INFO: English detected - no translation needed")
        
        return TranslationResponse(
            detected_language=detected_language,
            subject_translated=subject_translated,
            message_translated=message_translated,
            original_subject=request.subject,
            original_message=request.message
        )
        
    except Exception as e:
        print(f"ERROR: Translation endpoint failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}"
        )

@router.post("/analyze", response_model=SemanticAnalysisResponse)
def analyze_email(
    request: SemanticAnalysisRequest = Body(..., description="Email message to analyze")
) -> SemanticAnalysisResponse:
    """
    Analyze email semantics to extract key information.
    Works best with English text. Use /translate first for French emails.
    """
    try:
        print(f"INFO: Analyzing email semantics")
        analysis_result = analyze_email_semantics(request.message)
        
        if not analysis_result:
            raise HTTPException(
                status_code=500,
                detail="Semantic analysis failed to extract information. Please ensure the text is in English."
            )
        
        print(f"INFO: Semantic analysis completed")
        return SemanticAnalysisResponse(
            main_subject=analysis_result.get("main_subject", "Unknown"),
            short_summary=analysis_result.get("short_summary", "No summary available"),
            email_type=analysis_result.get("email_type", "Other"),
            participants=analysis_result.get("participants", []),
            sentiment=analysis_result.get("sentiment", "Neutral"),
            urgency=UrgencyInfo(
                is_urgent=analysis_result.get("urgency", {}).get("is_urgent", False),
                justification=analysis_result.get("urgency", {}).get("justification", "No urgency information")
            ),
            original_message=request.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Semantic analysis endpoint failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Semantic analysis failed: {str(e)}"
        )

@router.post("/summary", response_model=SummaryResponse)
def summarize_email_endpoint(
    request: SummaryRequest = Body(..., description="Email message to summarize")
) -> SummaryResponse:
    """
    Generate a concise summary and extract key points from an email.
    Supports French emails via automatic translation.
    """
    try:
        print(f"INFO: Starting email summarization")
        detected_language, is_french = detect_language(request.message)
        print(f"INFO: Detected language: {detected_language}")
        
        text_to_summarize = request.message
        was_translated = False
        
        if is_french:
            print("INFO: French detected - translating to English before summarization")
            text_to_summarize = translate_text_to_english(request.message)
            was_translated = True
            print("INFO: Translation completed")
        
        print("INFO: Generating summary and key points")
        summary_result = summarize_email(text_to_summarize)
        
        if not summary_result:
            raise HTTPException(
                status_code=500,
                detail="Summarization failed to extract information. Please check the input text."
            )
        
        print(f"INFO: Summarization completed")
        return SummaryResponse(
            summary=summary_result.get("summary", "No summary available"),
            key_points=summary_result.get("key_points", []),
            detected_language=detected_language,
            was_translated=was_translated,
            original_message=request.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Summary endpoint failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )

@router.post("/tasks", response_model=TaskDetectionResponse)
def detect_tasks_endpoint(
    request: TaskDetectionRequest = Body(..., description="Email message to extract tasks from")
) -> TaskDetectionResponse:
    """
    Detect and extract actionable tasks from an email.
    Supports French emails via automatic translation.
    """
    try:
        print(f"INFO: Starting task detection")
        detected_language, is_french = detect_language(request.message)
        print(f"INFO: Detected language: {detected_language}")
        
        text_for_detection = request.message
        if is_french:
            print("INFO: French detected - translating to English before task detection")
            text_for_detection = translate_text_to_english(request.message)
            print("INFO: Translation completed")
        
        print("INFO: Detecting tasks from email")
        task_result = detect_tasks(text_for_detection)
        
        if not task_result:
            print("INFO: No tasks detected in email")
            return TaskDetectionResponse(
                tasks=[],
                task_count=0,
                has_tasks=False,
                original_message=request.message
            )
        
        tasks_list = task_result.get("tasks", [])
        task_objects = [
            Task(
                task_description=task_data.get("task_description", "Unknown task"),
                assignee=task_data.get("assignee"),
                deadline=task_data.get("deadline"),
                priority=task_data.get("priority", "Medium")
            )
            for task_data in tasks_list
        ]
        
        print(f"INFO: Task detection completed - found {len(task_objects)} tasks")
        return TaskDetectionResponse(
            tasks=task_objects,
            task_count=len(task_objects),
            has_tasks=len(task_objects) > 0,
            original_message=request.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Task detection endpoint failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Task detection failed: {str(e)}"
        )

@router.post("/reply", response_model=AutoReplyResponse)
def generate_reply_endpoint(
    request: AutoReplyRequest = Body(..., description="Email message to generate a reply for")
) -> AutoReplyResponse:
    """
    Generate an intelligent, context-aware auto-reply to an email.
    Supports French emails via automatic translation.
    """
    try:
        print(f"INFO: Starting auto-reply generation")
        detected_language, is_french = detect_language(request.message)
        print(f"INFO: Detected language: {detected_language}")
        
        text_for_reply = request.message
        was_translated = False
        
        if is_french:
            print("INFO: French detected - translating to English before generating reply")
            text_for_reply = translate_text_to_english(request.message)
            was_translated = True
            print("INFO: Translation completed")
        
        print("INFO: Generating auto-reply")
        reply_result = generate_auto_reply(text_for_reply)
        
        if not reply_result:
            print("ERROR: generate_auto_reply returned None")
            raise HTTPException(
                status_code=500,
                detail="Auto-reply generation failed. The LLM did not return a valid response."
            )
        
        print(f"INFO: Auto-reply generation completed successfully")
        return AutoReplyResponse(
            reply=reply_result.get("reply", "Thank you for your email. I will get back to you shortly."),
            tone=reply_result.get("tone", "Professional"),
            detected_language=detected_language,
            was_translated=was_translated,
            original_message=request.message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Auto-reply endpoint failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Auto-reply generation failed: {str(e)}"
        )