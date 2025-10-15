"use client";

import { useEffect } from "react";
import { useChatbot } from "@/components/chatbot/ChatbotContext";

interface ThreadSelectorProps {
  threadId: string;
  subject: string;
  from: string;
}

export default function ThreadSelector({ threadId, subject, from }: ThreadSelectorProps) {
  const { setSelectedThread } = useChatbot();

  useEffect(() => {
    // Set this thread as selected when the page loads
    setSelectedThread({
      id: threadId,
      subject: subject,
      from: from
    });

    // Cleanup: don't clear on unmount to preserve selection when navigating away
  }, [threadId, subject, from, setSelectedThread]);

  return null; // This component doesn't render anything
}
