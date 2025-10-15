"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SelectedThread {
  id: string;
  subject: string;
  from: string;
}

interface ThemeInfo {
  theme_id: number;
  description: string;
  representative_text: string;
}

interface AttachmentClassification {
  themes: ThemeInfo[];
  total_themes: number;
  total_chunks: number;
  processing_time_seconds: number;
}

interface ProcessedAttachment {
  messageId: string;
  attachmentId: string;
  filename: string;
  extractedText: string;
  metadata: {
    size_kb: number;
    mime_type: string;
    extension: string;
  };
  classification?: AttachmentClassification;
  classificationProcessing?: boolean; // Track if classification is in progress
}

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedThread: SelectedThread | null;
  setSelectedThread: (thread: SelectedThread | null) => void;
  processedAttachments: ProcessedAttachment[];
  setProcessedAttachments: (attachments: ProcessedAttachment[] | ((prev: ProcessedAttachment[]) => ProcessedAttachment[])) => void;
  addProcessedAttachment: (attachment: ProcessedAttachment) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<SelectedThread | null>(null);
  const [processedAttachments, setProcessedAttachments] = useState<ProcessedAttachment[]>([]);

  const addProcessedAttachment = (attachment: ProcessedAttachment) => {
    setProcessedAttachments(prev => [...prev, attachment]);
  };

  return (
    <ChatbotContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      selectedThread, 
      setSelectedThread,
      processedAttachments,
      setProcessedAttachments,
      addProcessedAttachment
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}

export type { SelectedThread, ProcessedAttachment, ThemeInfo, AttachmentClassification };
