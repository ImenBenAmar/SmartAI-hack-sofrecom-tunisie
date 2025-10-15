"use client";

import { useEffect, useState } from "react";
import { useChatbot, type ProcessedAttachment } from "../chatbot/ChatbotContext";
import { processAttachment, downloadAttachmentAsBase64 } from "@/lib/attachmentApi";
import { classifyDocument } from "@/lib/classificationApi";

interface Attachment {
  attachmentId: string;
  filename: string;
  mimeType?: string;
  size?: number;
}

interface Message {
  id: string;
  attachments?: Attachment[];
}

interface AttachmentProcessorProps {
  messages: Message[];
}

export default function AttachmentProcessor({ messages }: AttachmentProcessorProps) {
  const { setProcessedAttachments } = useChatbot();
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    processAllAttachments();
  }, [messages]);

  const processAllAttachments = async () => {
    // Collect all attachments from all messages
    const allAttachments: Array<{ messageId: string; attachment: Attachment }> = [];
    
    messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(att => {
          allAttachments.push({
            messageId: message.id,
            attachment: att,
          });
        });
      }
    });

    if (allAttachments.length === 0) {
      return; // No attachments to process
    }

    setTotalCount(allAttachments.length);
    setProcessing(true);
    setProcessedCount(0);
    setShowComplete(false);

    const processed: ProcessedAttachment[] = [];

    for (const { messageId, attachment } of allAttachments) {
      try {
        console.log(`Processing attachment: ${attachment.filename}`);

        // Download attachment as base64
        const base64Content = await downloadAttachmentAsBase64(messageId, attachment.attachmentId);

        // Process attachment via API
        const result = await processAttachment(base64Content, attachment.filename);

        console.log('API Response:', result);

        if (result.processing_successful && result.metadata) {
          const attachmentData: ProcessedAttachment = {
            messageId,
            attachmentId: attachment.attachmentId,
            filename: attachment.filename,
            extractedText: result.extracted_text,
            metadata: {
              size_kb: result.metadata.size_kb,
              mime_type: result.metadata.mime_type,
              extension: result.metadata.extension,
            },
            classificationProcessing: true, // Mark as processing
          };

          processed.push(attachmentData);

          // Classify document themes in background (don't wait)
          classifyDocument(result.extracted_text, 5)
            .then(classification => {
              console.log(`🎯 Classified themes for ${attachment.filename}:`, classification.themes);
              // Update the attachment with classification and remove processing flag
              setProcessedAttachments((prev: ProcessedAttachment[]) => 
                prev.map((att: ProcessedAttachment) => 
                  att.messageId === messageId && att.attachmentId === attachment.attachmentId
                    ? { ...att, classification, classificationProcessing: false }
                    : att
                )
              );
            })
            .catch(err => {
              console.error(`Failed to classify ${attachment.filename}:`, err);
              // Remove processing flag even on error
              setProcessedAttachments((prev: ProcessedAttachment[]) => 
                prev.map((att: ProcessedAttachment) => 
                  att.messageId === messageId && att.attachmentId === attachment.attachmentId
                    ? { ...att, classificationProcessing: false }
                    : att
                )
              );
            });

          console.log(`✅ Processed: ${attachment.filename} (${result.text_length} chars)`);
        } else {
          console.error(`Failed to process ${attachment.filename}:`, result.error || 'Unknown error');
        }

        setProcessedCount(prev => prev + 1);
      } catch (error) {
        console.error(`Error processing ${attachment.filename}:`, error);
        setProcessedCount(prev => prev + 1);
      }
    }

    // Update context with all processed attachments
    setProcessedAttachments(processed);
    setSuccessCount(processed.length);
    setProcessing(false);
    setShowComplete(true);

    console.log(`✅ Attachment processing complete: ${processed.length}/${allAttachments.length} successful`);
    console.log('📋 Processed attachments:', processed);
    console.log('🔍 First attachment sample:', processed[0]);

    // Hide completion message after 5 seconds
    setTimeout(() => {
      setShowComplete(false);
    }, 5000);
  };

  if (totalCount === 0) {
    return null; // No attachments, don't show anything
  }

  // Show completion message
  if (showComplete && !processing) {
    return (
      <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
        <span>
          <strong>✅ Processing complete!</strong> {successCount} attachment{successCount !== 1 ? 's' : ''} ready for AI analysis.
          {successCount < totalCount && ` (${totalCount - successCount} failed)`}
        </span>
      </div>
    );
  }

  // Show processing indicator
  if (processing) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Processing...</span>
        </div>
        <span>
          📎 Processing attachments for AI analysis... ({processedCount}/{totalCount})
        </span>
      </div>
    );
  }

  return null;
}
