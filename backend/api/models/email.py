"""
Pydantic models for email processing endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional, List

class TranslationRequest(BaseModel):
    """Request model for translation endpoint"""
    subject: str = Field(..., description="Email subject line")
    message: str = Field(..., description="Email message body")
    
    class Config:
        json_schema_extra = {
            "example": {
                "subject": "Réunion importante demain",
                "message": "Bonjour équipe,\n\nJe voudrais organiser une réunion demain à 14h pour discuter du projet.\n\nCordialement"
            }
        }

class TranslationResponse(BaseModel):
    """Response model for translation endpoint"""
    detected_language: str = Field(..., description="Detected language of the input text")
    subject_translated: Optional[str] = Field(None, description="Translated subject (null if already in English)")
    message_translated: Optional[str] = Field(None, description="Translated message (null if already in English)")
    original_subject: str = Field(..., description="Original subject for reference")
    original_message: str = Field(..., description="Original message for reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "detected_language": "French",
                "subject_translated": "Important meeting tomorrow",
                "message_translated": "Hello team,\n\nI would like to organize a meeting tomorrow at 2pm to discuss the project.\n\nBest regards",
                "original_subject": "Réunion importante demain",
                "original_message": "Bonjour équipe,\n\nJe voudrais organiser une réunion demain à 14h pour discuter du projet.\n\nCordialement"
            }
        }

class SemanticAnalysisRequest(BaseModel):
    """Request model for semantic analysis endpoint"""
    message: str = Field(..., description="Email message to analyze (include subject in the message if needed)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Subject: Important meeting tomorrow\n\nHello team,\n\nI would like to organize a meeting tomorrow at 2pm to discuss the project.\n\nBest regards,\nJohn"
            }
        }

class UrgencyInfo(BaseModel):
    """Urgency information"""
    is_urgent: bool = Field(..., description="Whether the email is urgent")
    justification: str = Field(..., description="Explanation of urgency level")

class SemanticAnalysisResponse(BaseModel):
    """Response model for semantic analysis endpoint"""
    main_subject: str = Field(..., description="Main subject of the email")
    short_summary: str = Field(..., description="One-sentence summary")
    email_type: str = Field(..., description="Classification: 'Action Request', 'Information', 'Meeting Planning', 'Reply', 'Report', 'Social', 'Event', 'Other'")
    participants: list[str] = Field(..., description="List of people mentioned in the email")
    sentiment: str = Field(..., description="Overall sentiment: 'Positive', 'Negative', or 'Neutral'")
    urgency: UrgencyInfo = Field(..., description="Urgency information")
    original_message: str = Field(..., description="Original message for reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "main_subject": "Project meeting tomorrow",
                "short_summary": "Request to organize a meeting tomorrow at 2pm to discuss the project.",
                "email_type": "Meeting Planning",
                "participants": ["team", "you"],
                "sentiment": "Neutral",
                "urgency": {
                    "is_urgent": True,
                    "justification": "Meeting scheduled for tomorrow requires prompt response"
                },
                "original_message": "Subject: Important meeting tomorrow\n\nHello team,\n\nI would like to organize a meeting tomorrow at 2pm to discuss the project.\n\nBest regards"
            }
        }

class SummaryRequest(BaseModel):
    """Request model for summary endpoint"""
    message: str = Field(..., description="Email message to summarize")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Subject: Project Update\n\nHello team,\n\nI wanted to update you on the progress of our Q4 project..."
            }
        }

class SummaryResponse(BaseModel):
    """Response model for summary endpoint"""
    summary: str = Field(..., description="Concise summary of the email")
    key_points: list[str] = Field(..., description="List of key points from the email")
    detected_language: str = Field(..., description="Original language detected")
    was_translated: bool = Field(..., description="Whether the text was translated from French")
    original_message: str = Field(..., description="Original message for reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Sarah provides a Q4 project update indicating 75% completion of development.",
                "key_points": [
                    "Project is 75% complete and on schedule for December deadline",
                    "Backend API and database migration completed",
                    "Testing phase starts next week"
                ],
                "detected_language": "English",
                "was_translated": False,
                "original_message": "Subject: Project Update\n\nHello team,\n\nI wanted to update you..."
            }
        }

class Task(BaseModel):
    """Individual task model"""
    task_description: str = Field(..., description="Description of the task")
    assignee: Optional[str] = Field(None, description="Person assigned to the task (if mentioned)")
    deadline: Optional[str] = Field(None, description="Deadline or due date (if mentioned)")
    priority: str = Field(..., description="Priority level: 'High', 'Medium', or 'Low'")

class TaskDetectionRequest(BaseModel):
    """Request model for task detection endpoint"""
    message: str = Field(..., description="Email message to extract tasks from")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Subject: Action Items\n\nHi team,\n\nFollowing up on today's meeting..."
            }
        }

class TaskDetectionResponse(BaseModel):
    """Response model for task detection endpoint"""
    tasks: list[Task] = Field(..., description="List of detected tasks")
    task_count: int = Field(..., description="Total number of tasks detected")
    has_tasks: bool = Field(..., description="Whether any tasks were found")
    original_message: str = Field(..., description="Original message for reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "tasks": [
                    {
                        "task_description": "Review the technical specification document",
                        "assignee": "Sarah",
                        "deadline": "Friday",
                        "priority": "High"
                    }
                ],
                "task_count": 1,
                "has_tasks": True,
                "original_message": "Subject: Action Items\n\nHi team,\n\nFollowing up on today's meeting..."
            }
        }

class AutoReplyRequest(BaseModel):
    """Request model for auto-reply endpoint"""
    message: str = Field(..., description="Email message to generate a reply for")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Subject: Meeting Request\n\nHi John,\n\nI hope this email finds you well..."
            }
        }

class AutoReplyResponse(BaseModel):
    """Response model for auto-reply endpoint"""
    reply: str = Field(..., description="Generated reply to the email")
    tone: str = Field(..., description="Tone of the reply: 'Professional', 'Casual', 'Formal'")
    detected_language: str = Field(..., description="Original language detected")
    was_translated: bool = Field(..., description="Whether the original message was translated from French")
    original_message: str = Field(..., description="Original message for reference")
    
    class Config:
        json_schema_extra = {
            "example": {
                "reply": "Hi Sarah,\n\nThank you for reaching out. Wednesday afternoon works well for me...",
                "tone": "Professional",
                "detected_language": "English",
                "was_translated": False,
                "original_message": "Subject: Meeting Request\n\nHi John,\n\nI hope this email finds you well..."
            }
        }