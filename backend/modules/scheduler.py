from modules.llm_client import call_llm_api, extract_json_from_response
from datetime import datetime, timedelta, timezone
from modules.calendar_service import get_calendar_service
from googleapiclient.errors import HttpError

def parse_event_datetime(dt_str: str):
    """Convertit une date/heure Google Calendar en datetime aware UTC"""
    dt = datetime.fromisoformat(dt_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


def get_user_availability():
    """
    Récupère les créneaux libres à partir du Google Calendar pour les 7 prochains jours.
    Retourne une liste de créneaux horaires libres (1 heure chacun) dans les plages 8h-12h et 14h-17h.
    """
    try:
        service = get_calendar_service()
        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=7)

        # Récupérer les événements pour les 7 prochains jours
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now.isoformat(),
            timeMax=end_date.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        # Définir les plages horaires de disponibilité (8h-12h, 14h-17h)
        availability = []
        for i in range(1, 8):
            day = (now + timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            for start_hour in [8, 9, 10, 11, 14, 15, 16]:  # Créneaux d'une heure
                start_time = day.replace(hour=start_hour, tzinfo=timezone.utc)
                end_time = start_time + timedelta(hours=1)

                # Vérifier si le créneau est libre
                is_free = True
                for event in events:
                    event_start = parse_event_datetime(event['start'].get('dateTime', event['start'].get('date')))
                    event_end   = parse_event_datetime(event['end'].get('dateTime', event['end'].get('date')))

                    if not (end_time <= event_start or start_time >= event_end):
                        is_free = False
                        break

                if is_free:
                    availability.append(f"{start_time.strftime('%Y-%m-%d')} de {start_time.strftime('%H:%M')} à {end_time.strftime('%H:%M')}")

        return availability

    except HttpError as e:
        print(f"Erreur lors de l'accès au calendrier Google : {str(e)}")
        return []
    except Exception as e:
        print(f"Erreur inattendue dans get_user_availability : {str(e)}")
        return []

def is_slot_available(proposed_start: datetime, duration_minutes: int, events: list) -> bool:
    """
    Vérifie si un créneau proposé est libre dans le calendrier.
    """
    proposed_end = proposed_start + timedelta(minutes=duration_minutes)
    for event in events:
        event_start = parse_event_datetime(event['start'].get('dateTime', event['start'].get('date')))
        event_end   = parse_event_datetime(event['end'].get('dateTime', event['end'].get('date')))

        if not (proposed_end <= event_start or proposed_start >= event_end):
            return False
    return True

def extract_schedule_info(text: str, model_name: str) -> dict:
    """
    Analyse un texte pour identifier les propositions de réunion et vérifier les disponibilités réelles.
    Si aucune date spécifique, propose des créneaux libres. Si occupé, retourne un message.
    """
    # Récupérer les disponibilités réelles
    user_availability = get_user_availability()
    service = get_calendar_service()
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=7)
    
    # Récupérer les événements pour la proposition (initialement pour le contexte)
    events = service.events().list(
        calendarId='primary',
        timeMin=now.isoformat(),
        timeMax=end_date.isoformat(),
        singleEvents=True,
        orderBy='startTime'
    ).execute().get('items', [])
    
    prompt = f"""
    Your task is to act as an intelligent scheduling assistant. Analyze the following email text to identify any meeting proposals.
    In addition to detecting the proposed date, start time, and duration (in minutes), please:
    - Provide a concise "summary" that captures what the meeting is about based on the email content.
    - Calculate the correct "duree_minutes" if mentioned explicitly (e.g. from start to end times) or deduce it from context.
    
    CONTEXT:
    - Today's date is {datetime.now().strftime('%Y-%m-%d')}.
    - My available slots for the next week are: {"; ".join(user_availability) if user_availability else "Aucun créneau libre"}.
    
    RULES:
    1. FIRST, if a meeting proposal exists (with dates/times), output a JSON list with objects in the following format:
         [ {{
             "date": "YYYY-MM-DD",
             "heure": "HH:MM",
             "duree_minutes": (calculated duration in minutes),
             "summary": "A concise description of the meeting topic",
             "type": "visio"
         }} ]
       - Verify the slot’s availability; if unavailable, output:
         {{ "status": "occupied", "message": "Je suis occupé à ce moment-là." }}
    
    2. SECOND, if there is no specific date provided, propose three suitable one-hour slots based on my availability:
         {{
           "suggestion_requise": true,
           "creneaux_proposes": [
             {{ "date": "YYYY-MM-DD", "heure": "HH:MM" }},
             {{ "date": "YYYY-MM-DD", "heure": "HH:MM" }},
             {{ "date": "YYYY-MM-DD", "heure": "HH:MM" }}
           ]
         }}
    
    3. THIRD, if the email text has no meeting mention, return an empty list [].
    
    CRITICAL:
    - Return ONLY the valid JSON as specified.
    
    Analyze the following text:
    ---
    {text}
    ---
    """
    response = call_llm_api(prompt, model_name=model_name, max_tokens=2048)
    if not response:
        return {"error": "API response error"}

    result = extract_json_from_response(response)
    
    # Vérifier les propositions de réunion pour les conflits
    if isinstance(result, list) and result:
        for meeting in result:
            try:
                local_tz = datetime.now().astimezone().tzinfo
                proposed_time = datetime.strptime(f"{meeting['date']} {meeting['heure']}", '%Y-%m-%d %H:%M')
                proposed_time = proposed_time.replace(tzinfo=local_tz).astimezone(timezone.utc)
                # Use the duration detected by LLM; do not default to 60.
                if "duree_minutes" in meeting:
                    duration = meeting["duree_minutes"]
                else:
                    return {"error": "La durée n'est pas détectée par le LLM."}
    
                # Query events specifically for the proposed timeslot
                timeMin = proposed_time.isoformat()
                timeMax = (proposed_time + timedelta(minutes=duration)).isoformat()
                specific_events = service.events().list(
                    calendarId='primary',
                    timeMin=timeMin,
                    timeMax=timeMax,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute().get('items', [])
    
                if not is_slot_available(proposed_time, duration, specific_events):
                    return {"status": "occupied", "message": "Je suis occupé à ce moment-là."}
            except ValueError as e:
                print(f"Erreur de format de date/heure : {str(e)}")
                return {"error": "Invalid date format in proposal"}
    
    return result