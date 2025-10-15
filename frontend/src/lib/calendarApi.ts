/**
 * Calendar API Client
 * Handles meeting detection and calendar event scheduling
 */

const API_BASE_URL = 'http://127.0.0.1:8002';

// ======================= REQUEST/RESPONSE TYPES =======================

export interface CalendarAnalyzeRequest {
  text: string;
}

export interface ProposedEvent {
  date: string;          // YYYY-MM-DD
  heure: string;         // HH:MM
  duree_minutes: number;
  summary: string;
  type?: string;
}

export interface CalendarAnalyzeResponse {
  status: 'free' | 'occupied' | 'suggestion_required' | 'no_meeting';
  proposed_event?: ProposedEvent;
  message?: string;
  creneaux_proposes?: Array<{
    date: string;
    heure: string;
  }>;
}

export interface CalendarScheduleRequest {
  date: string;
  heure: string;
  duree_minutes: number;
  summary: string;
  description?: string;
}

export interface CalendarScheduleResponse {
  htmlLink: string;
}

// ======================= API FUNCTIONS =======================

/**
 * Analyze email text to detect meeting requests
 * @param text - The email text to analyze
 * @returns Analysis result with meeting detection status
 */
export async function analyzeForMeeting(text: string): Promise<CalendarAnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text } as CalendarAnalyzeRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Calendar analysis failed: ${errorData.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * Schedule a meeting in Google Calendar
 * @param event - Event details
 * @returns Calendar event link
 */
export async function scheduleEvent(event: CalendarScheduleRequest): Promise<CalendarScheduleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calendar/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Event scheduling failed: ${errorData.detail || response.statusText}`);
  }

  return response.json();
}
