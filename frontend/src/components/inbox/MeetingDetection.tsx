"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { analyzeForMeeting, scheduleEvent, type CalendarAnalyzeResponse, type ProposedEvent } from "@/lib/calendarApi";
import { 
  saveScheduledMeeting, 
  getAllScheduledMeetings, 
  type ScheduledMeetingData 
} from "@/lib/scheduledMeetingsService";

interface MeetingDetectionProps {
  messages: Array<{
    id: string;
    subject?: string;
    body?: {
      text?: string;
      html?: string;
    };
    snippet?: string;
  }>;
}

export default function MeetingDetection({ messages }: MeetingDetectionProps) {
  const { data: session } = useSession();
  const [analyzing, setAnalyzing] = useState(false);
  const [meetingResults, setMeetingResults] = useState<Array<{
    messageId: string;
    result: CalendarAnalyzeResponse;
  }>>([]);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [scheduledLinks, setScheduledLinks] = useState<Record<string, string>>({});
  const [scheduledMeetingsData, setScheduledMeetingsData] = useState<Record<string, ScheduledMeetingData>>({});
  const [loadingPersisted, setLoadingPersisted] = useState(true);

  // Load persisted scheduled meetings on mount
  useEffect(() => {
    loadPersistedScheduledMeetings();
  }, [session]);

  useEffect(() => {
    // Only analyze if we've loaded persisted data
    if (!loadingPersisted) {
      analyzeMeetings();
    }
  }, [messages, loadingPersisted]);

  const loadPersistedScheduledMeetings = async () => {
    if (!session?.user?.email) {
      setLoadingPersisted(false);
      return;
    }

    try {
      const userId = session.user.email;
      const persistedMeetings = await getAllScheduledMeetings(userId);
      
      // Store full meeting data
      setScheduledMeetingsData(persistedMeetings);
      
      // Convert to scheduledLinks format
      const links: Record<string, string> = {};
      Object.entries(persistedMeetings).forEach(([messageId, data]) => {
        links[messageId] = data.calendarLink;
      });
      
      setScheduledLinks(links);
      console.log('Loaded persisted scheduled meetings:', Object.keys(links).length);
    } catch (error) {
      console.error('Failed to load persisted meetings:', error);
    } finally {
      setLoadingPersisted(false);
    }
  };

  const analyzeMeetings = async () => {
    setAnalyzing(true);
    setMeetingResults([]);

    try {
      const results: Array<{ messageId: string; result: CalendarAnalyzeResponse }> = [];

      for (const message of messages) {
        // Check if this message is already scheduled in Firebase
        if (scheduledLinks[message.id]) {
          console.log(`Message ${message.id} already scheduled, skipping analysis`);
          
          // Get the full meeting data from Firebase
          const meetingData = scheduledMeetingsData[message.id];
          
          // Create a result to display as already scheduled with real data
          results.push({
            messageId: message.id,
            result: {
              status: 'free',
              proposed_event: {
                date: meetingData?.eventDetails.date || '',
                heure: meetingData?.eventDetails.heure || '',
                duree_minutes: meetingData?.eventDetails.duree_minutes || 60,
                summary: meetingData?.eventDetails.summary || 'Previously Scheduled Meeting',
              }
            }
          });
          continue; // Skip API call for this message
        }

        // Combine subject and body text
        const messageText = message.body?.text || message.snippet || '';
        const subject = message.subject || '';
        const combinedText = subject ? `Subject: ${subject}\n\n${messageText}` : messageText;

        if (!combinedText.trim()) continue;

        try {
          const result = await analyzeForMeeting(combinedText);
          
          console.log(`Analysis result for message ${message.id}:`, result);
          
          // Store results if a meeting was detected (free, occupied, or needs suggestion)
          if (result.status === 'free' || result.status === 'occupied' || result.status === 'suggestion_required') {
            results.push({
              messageId: message.id,
              result,
            });
            console.log(`Meeting detected in message ${message.id}, status: ${result.status}`);
          }
        } catch (error) {
          console.error(`Failed to analyze message ${message.id}:`, error);
        }
      }

      setMeetingResults(results);
    } catch (error) {
      console.error('Meeting analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSchedule = async (messageId: string, event: ProposedEvent) => {
    if (!session?.user?.email) {
      alert('Please sign in to schedule meetings');
      return;
    }

    setScheduling(messageId);

    try {
      const result = await scheduleEvent({
        date: event.date,
        heure: event.heure,
        duree_minutes: event.duree_minutes,
        summary: event.summary,
        description: `Meeting scheduled via SmartMail AI`,
      });

      // Save to Firebase
      const userId = session.user.email;
      await saveScheduledMeeting(userId, messageId, result.htmlLink, {
        date: event.date,
        heure: event.heure,
        duree_minutes: event.duree_minutes,
        summary: event.summary,
      });

      // Store the calendar link in local state
      setScheduledLinks((prev) => ({
        ...prev,
        [messageId]: result.htmlLink,
      }));

      console.log('Event scheduled and saved to Firebase:', result.htmlLink);
    } catch (error) {
      console.error('Scheduling failed:', error);
      alert(`Failed to schedule meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScheduling(null);
    }
  };

  if (analyzing || loadingPersisted) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Analyzing...</span>
        </div>
        <span>{loadingPersisted ? '📋 Loading scheduled meetings...' : '🔍 Analyzing messages for meeting requests...'}</span>
      </div>
    );
  }

  if (meetingResults.length === 0) {
    return (
      <div className="alert alert-secondary d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-calendar-x"></i>
        <span>No meeting requests detected in this thread.</span>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h5 className="mb-3">📅 Meeting Requests Detected ({meetingResults.length})</h5>
      
      {meetingResults.map(({ messageId, result }) => {
        const isScheduled = scheduledLinks[messageId];
        const isFromFirebase = scheduledMeetingsData[messageId] !== undefined;
        
        console.log('Rendering result:', { messageId, status: result.status, hasProposedEvent: !!result.proposed_event, isFromFirebase, result });
        
        if ((result.status === 'free' || result.status === 'occupied') && result.proposed_event) {
          const event = result.proposed_event;
          const isOccupied = result.status === 'occupied';
          
          return (
            <div key={messageId} className="card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-3">
                  <div className="flex-grow-1">
                    <h6 className="card-title mb-2">
                      {isOccupied ? (
                        <span className="badge bg-danger me-2">Not Available</span>
                      ) : isFromFirebase ? (
                        <span className="badge bg-info me-2">Already Scheduled</span>
                      ) : (
                        <span className="badge bg-success me-2">Available</span>
                      )}
                      {event.summary}
                    </h6>
                    
                    {isFromFirebase && (
                      <div className="alert alert-info mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        This meeting was previously scheduled on {new Date(scheduledMeetingsData[messageId]?.scheduledAt || 0).toLocaleString()}
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <strong>📅 Date:</strong> {event.date ? new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </div>
                    
                    <div className="mb-2">
                      <strong>🕐 Time:</strong> {event.heure || 'N/A'}
                    </div>
                    
                    <div className="mb-2">
                      <strong>⏱️ Duration:</strong> {event.duree_minutes} minutes
                    </div>
                    
                    {event.type && (
                      <div className="mb-2">
                        <strong>📍 Type:</strong> {event.type}
                      </div>
                    )}
                    
                    {isOccupied && (
                      <div className="alert alert-warning mt-3 mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Conflict:</strong> {result.message || "You already have an event scheduled at this time."}
                      </div>
                    )}
                  </div>
                  
                  <div className="d-flex flex-column gap-2">
                    {!isScheduled ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSchedule(messageId, event)}
                        disabled={scheduling === messageId || isOccupied}
                        title={isOccupied ? "Time slot not available" : "Schedule this meeting"}
                      >
                        {scheduling === messageId ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-calendar-plus me-2"></i>
                            Schedule Meeting
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <div className="alert alert-success mb-0 p-2">
                          <i className="bi bi-check-circle me-2"></i>
                          Scheduled!
                        </div>
                        <a
                          href={isScheduled}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-calendar-event me-2"></i>
                          View in Calendar
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (result.status === 'suggestion_required' && result.creneaux_proposes) {
          return (
            <div key={messageId} className="card mb-3">
              <div className="card-body">
                <h6 className="card-title mb-3">
                  <span className="badge bg-warning text-dark me-2">Needs Scheduling</span>
                  Meeting request detected - No specific time provided
                </h6>
                
                <p className="mb-2">Suggested available time slots:</p>
                <ul className="list-group">
                  {result.creneaux_proposes.map((slot, idx) => (
                    <li key={idx} className="list-group-item">
                      📅 {new Date(slot.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })} at {slot.heure}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }
        
        // Fallback: Show debug info if result structure is unexpected
        return (
          <div key={messageId} className="card mb-3 border-warning">
            <div className="card-body">
              <h6 className="card-title mb-3">
                <span className="badge bg-warning text-dark me-2">Debug Info</span>
                Unexpected response structure
              </h6>
              <p className="mb-2"><strong>Status:</strong> {result.status}</p>
              <p className="mb-2"><strong>Message:</strong> {result.message || 'N/A'}</p>
              <details>
                <summary className="btn btn-sm btn-outline-secondary">View Raw Response</summary>
                <pre className="mt-2 p-2 bg-light border rounded" style={{ fontSize: '0.85rem' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}
