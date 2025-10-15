"""
Endpoints for Google Calendar integration.
"""
from fastapi import APIRouter, HTTPException
from api.models.calendar import CalendarEventRequest, CalendarAvailabilityResponse, CalendarAnalyzeRequest, CalendarEventResponse
from modules.calendar_service import get_calendar_service
from modules.scheduler import get_user_availability, extract_schedule_info
from modules.llm_client import MODEL_FOR_SEMANTICS
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/calendar/availability", response_model=CalendarAvailabilityResponse)
def get_availability():
    """
    Get available time slots from Google Calendar.
    """
    try:
        print("INFO: Fetching calendar availability")
        slots = get_user_availability()
        print(f"INFO: Found {len(slots)} available slots")
        return {"availability": slots}
    except Exception as e:
        print(f"ERROR: Failed to get calendar availability: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve calendar availability: {str(e)}"
        )

@router.post("/calendar/schedule", response_model=CalendarEventResponse)
def schedule_event(event: CalendarEventRequest):
    """
    Schedule a new event in Google Calendar.
    """
    try:
        print(f"INFO: Scheduling event on {event.date} at {event.heure}")
        local_tz = datetime.now().astimezone().tzinfo
        start_datetime = datetime.strptime(f"{event.date} {event.heure}", '%Y-%m-%d %H:%M')
        start_datetime = start_datetime.replace(tzinfo=local_tz).astimezone(timezone.utc)
        end_datetime = start_datetime + timedelta(minutes=event.duree_minutes)
        
        service = get_calendar_service()
        event_body = {
            'summary': event.summary,
            'description': event.description,
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'UTC',
            },
        }
        
        result = service.events().insert(calendarId='primary', body=event_body).execute()
        print(f"INFO: Event scheduled successfully")
        return {"htmlLink": result.get("htmlLink")}
    
    except Exception as e:
        print(f"ERROR: Failed to schedule event: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to schedule event: {str(e)}"
        )

@router.post("/calendar/analyze")
def analyze_meeting_request(request: CalendarAnalyzeRequest):
    """
    Analyze email text to detect meeting proposals and check calendar availability.
    """
    try:
        print("INFO: Analyzing meeting request")
        result = extract_schedule_info(request.text, MODEL_FOR_SEMANTICS)
        
        if isinstance(result, dict) and result.get("status") == "occupied":
            print("INFO: Proposed time slot is occupied")
            return {"status": "occupied", "message": "I am busy at that time."}
        
        elif isinstance(result, list) and result:
            proposal = result[0]
            summary = proposal.get("summary", f"Meeting: {request.text[:30]}...")
            proposal["summary"] = summary
            print(f"INFO: Meeting proposal detected: {proposal}")
            return {"status": "free", "proposed_event": proposal}
        
        elif isinstance(result, dict) and result.get("suggestion_requise"):
            print("INFO: No specific time provided, suggesting slots")
            return {
                "status": "suggestion_required",
                "creneaux_proposes": result.get("creneaux_proposes", [])
            }
        
        else:
            print("INFO: No meeting detected in text")
            return {"status": "no_meeting", "message": "No meeting proposal detected."}
    
    except Exception as e:
        print(f"ERROR: Failed to analyze meeting request: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze meeting request: {str(e)}"
        )