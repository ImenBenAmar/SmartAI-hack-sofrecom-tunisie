"use client";

import { useChatbot, type ThemeInfo } from "../chatbot/ChatbotContext";
import { useState, useRef, useEffect } from "react";

interface AttachmentThemesBadgeProps {
  messageId: string;
  attachmentId: string;
}

export default function AttachmentThemesBadge({ messageId, attachmentId }: AttachmentThemesBadgeProps) {
  const { processedAttachments } = useChatbot();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the attachment with classification
  const attachment = processedAttachments.find(
    att => att.messageId === messageId && att.attachmentId === attachmentId
  );

  const classification = attachment?.classification;
  const isProcessing = attachment?.classificationProcessing;

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    }

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  // Show loading state while processing
  if (isProcessing) {
    return (
      <span className="badge bg-secondary text-white">
        <span className="spinner-border spinner-border-sm me-1" role="status" style={{ width: '0.75rem', height: '0.75rem' }}>
          <span className="visually-hidden">Processing...</span>
        </span>
        Processing themes...
      </span>
    );
  }

  if (!classification || !classification.themes || classification.themes.length === 0) {
    return null; // Don't show badge if no themes detected
  }

  return (
    <div className="position-relative d-inline-block">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-sm btn-outline-info"
        onClick={() => setShowPopover(!showPopover)}
        title="View document themes"
      >
        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
        </svg>
        Themes ({classification.total_themes})
      </button>

      {showPopover && (
        <div
          ref={popoverRef}
          className="card position-absolute shadow-lg border-info"
          style={{
            top: 'calc(100% + 8px)',
            left: 0,
            width: '400px',
            maxWidth: '90vw',
            zIndex: 1050,
            maxHeight: '500px',
            overflowY: 'auto'
          }}
        >
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <strong>🎯 Document Themes</strong>
            <button
              type="button"
              className="btn-close btn-close-white btn-sm"
              onClick={() => setShowPopover(false)}
              aria-label="Close"
            />
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {classification.themes.map((theme: ThemeInfo, index: number) => (
                <div key={theme.theme_id} className="list-group-item">
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-info rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {theme.theme_id}
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{theme.description}</h6>
                      <p className="mb-0 small text-muted" style={{ fontSize: '0.85rem' }}>
                        {theme.representative_text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card-footer text-muted small">
            <div className="d-flex justify-content-between">
              <span>📊 {classification.total_chunks} chunks analyzed</span>
              <span>⏱️ {classification.processing_time_seconds}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
