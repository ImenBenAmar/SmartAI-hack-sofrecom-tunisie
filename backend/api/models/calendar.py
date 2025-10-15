"""
Pydantic models for calendar integration endpoints.
"""
from pydantic import BaseModel, Field
from typing import List

class CalendarEventRequest(BaseModel):
    """Request model for creating calendar events"""
    date: str = Field(..., description="Event date in YYYY-MM-DD format")
    heure: str = Field(..., description="Event start time in HH:MM format")
    duree_minutes: int = Field(..., description="Event duration in minutes")
    summary: str = Field(default="Meeting scheduled via API", description="Event title/summary")
    description: str = Field(default="Event created via API.", description="Event description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2025-10-15",
                "heure": "14:00",
                "duree_minutes": 60,
                "summary": "Q4 Project Planning Meeting",
                "description": "Discuss Q4 project roadmap and deliverables"
            }
        }

class CalendarAvailabilityResponse(BaseModel):
    """Response model for availability endpoint"""
    availability: List[str] = Field(..., description="List of available time slots")
    
    class Config:
        json_schema_extra = {
            "example": {
                "availability": [
                    "2025-10-08 de 09:00 à 10:00",
                    "2025-10-08 de 14:00 à 15:00",
                    "2025-10-09 de 10:00 à 11:00"
                ]
            }
        }

class CalendarAnalyzeRequest(BaseModel):
    """Request model for analyzing meeting requests in emails"""
    text: str = Field(..., description="Email text to analyze for meeting proposals")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Hi, I would like to schedule a meeting on October 15th at 2pm to discuss the project."
            }
        }

class CalendarEventResponse(BaseModel):
    """Response model for scheduled events"""
    htmlLink: str = Field(..., description="Link to the created calendar event")
    
    class Config:
        json_schema_extra = {
            "example": {
                "htmlLink": "https://www.google.com/calendar/event?eid=..."
            }
        }