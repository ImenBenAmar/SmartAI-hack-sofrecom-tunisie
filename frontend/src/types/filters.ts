export interface SenderGroup {
  id: string;
  name: string;
  senders: string[]; // Array of email addresses
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxFilters {
  // Enable/disable all filters
  enabled?: boolean;
  
  // Sender filtering
  activeSenderGroups: string[]; // IDs of active sender groups
  individualSenders: string[]; // Individual email addresses
  
  // Date range filtering
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  
  // Read status filtering
  readStatus?: 'all' | 'read' | 'unread';
}

export interface UserFilterSettings {
  userId: string;
  senderGroups: SenderGroup[];
  activeFilters: InboxFilters;
  updatedAt: Date;
}
