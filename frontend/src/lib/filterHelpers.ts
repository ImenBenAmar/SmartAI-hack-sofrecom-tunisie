import { ref, get } from "firebase/database";
import { database } from "./firebase";
import type { UserFilterSettings, InboxFilters } from "@/types/filters";

export async function getSenderEmailsFromFilters(
  userEmail: string,
  filters: InboxFilters
): Promise<string[]> {
  if (filters.activeSenderGroups.length === 0 && filters.individualSenders.length === 0) {
    return [];
  }

  const senderEmails: string[] = [...filters.individualSenders];

  // Load sender groups from Firebase Realtime Database
  if (filters.activeSenderGroups.length > 0) {
    try {
      const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
      const dbRef = ref(database, `filterSettings/${sanitizedEmail}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val() as UserFilterSettings;
        const activeGroups = data.senderGroups?.filter((g) =>
          filters.activeSenderGroups.includes(g.id)
        );

        activeGroups?.forEach((group) => {
          senderEmails.push(...group.senders);
        });
      }
    } catch (error) {
      console.error("Error loading sender groups:", error);
    }
  }

  // Return unique emails
  return Array.from(new Set(senderEmails));
}

export function buildGmailQuery(filters: InboxFilters, senderEmails: string[]): string {
  const parts: string[] = [];

  // Sender filter
  if (senderEmails.length > 0) {
    const senderQuery = senderEmails.map((email) => `from:${email}`).join(" OR ");
    parts.push(`(${senderQuery})`);
  }

  // Date range filter
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start).toISOString().split("T")[0].replace(/-/g, "/");
    const endDate = new Date(filters.dateRange.end).toISOString().split("T")[0].replace(/-/g, "/");
    parts.push(`after:${startDate}`);
    parts.push(`before:${endDate}`);
  }

  // Read status filter
  if (filters.readStatus === 'unread') {
    parts.push('is:unread');
  } else if (filters.readStatus === 'read') {
    parts.push('is:read');
  }

  return parts.join(" ");
}
