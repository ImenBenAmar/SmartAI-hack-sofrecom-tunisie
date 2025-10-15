/**
 * Scheduled Meetings Service
 * Handles persistence of scheduled meetings in Firebase Realtime Database
 */

import { database } from './firebase';
import { ref, set, get, child } from 'firebase/database';

export interface ScheduledMeetingData {
  messageId: string;
  calendarLink: string;
  scheduledAt: number; // Unix timestamp
  eventDetails: {
    date: string;
    heure: string;
    duree_minutes: number;
    summary: string;
  };
}

/**
 * Save a scheduled meeting to Firebase
 * @param userId - The user's ID (email or auth ID)
 * @param messageId - The email message ID
 * @param calendarLink - The Google Calendar event link
 * @param eventDetails - Details of the scheduled event
 */
export async function saveScheduledMeeting(
  userId: string,
  messageId: string,
  calendarLink: string,
  eventDetails: {
    date: string;
    heure: string;
    duree_minutes: number;
    summary: string;
  }
): Promise<void> {
  try {
    const meetingData: ScheduledMeetingData = {
      messageId,
      calendarLink,
      scheduledAt: Date.now(),
      eventDetails,
    };

    // Store under: scheduledMeetings/{userId}/{messageId}
    const meetingRef = ref(database, `scheduledMeetings/${sanitizeKey(userId)}/${messageId}`);
    await set(meetingRef, meetingData);
    
    console.log('Scheduled meeting saved to Firebase:', messageId);
  } catch (error) {
    console.error('Failed to save scheduled meeting:', error);
    throw error;
  }
}

/**
 * Get a scheduled meeting from Firebase
 * @param userId - The user's ID (email or auth ID)
 * @param messageId - The email message ID
 * @returns The scheduled meeting data or null if not found
 */
export async function getScheduledMeeting(
  userId: string,
  messageId: string
): Promise<ScheduledMeetingData | null> {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `scheduledMeetings/${sanitizeKey(userId)}/${messageId}`));
    
    if (snapshot.exists()) {
      return snapshot.val() as ScheduledMeetingData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Failed to get scheduled meeting:', error);
    return null;
  }
}

/**
 * Get all scheduled meetings for a user
 * @param userId - The user's ID (email or auth ID)
 * @returns Map of messageId to ScheduledMeetingData
 */
export async function getAllScheduledMeetings(
  userId: string
): Promise<Record<string, ScheduledMeetingData>> {
  try {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `scheduledMeetings/${sanitizeKey(userId)}`));
    
    if (snapshot.exists()) {
      return snapshot.val() as Record<string, ScheduledMeetingData>;
    } else {
      return {};
    }
  } catch (error) {
    console.error('Failed to get all scheduled meetings:', error);
    return {};
  }
}

/**
 * Check if a message has been scheduled
 * @param userId - The user's ID (email or auth ID)
 * @param messageId - The email message ID
 * @returns True if the message has been scheduled
 */
export async function isMessageScheduled(
  userId: string,
  messageId: string
): Promise<boolean> {
  const meeting = await getScheduledMeeting(userId, messageId);
  return meeting !== null;
}

/**
 * Sanitize a key for Firebase (replace invalid characters)
 * Firebase keys cannot contain . $ # [ ] /
 * @param key - The key to sanitize
 * @returns Sanitized key
 */
function sanitizeKey(key: string): string {
  return key.replace(/[.#$[\]\/]/g, '_');
}
