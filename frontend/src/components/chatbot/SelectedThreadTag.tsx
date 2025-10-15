"use client";

import { useChatbot } from "./ChatbotContext";

export default function SelectedThreadTag() {
  const { selectedThread, setSelectedThread } = useChatbot();

  if (!selectedThread) return null;

  const handleRemove = () => {
    setSelectedThread(null);
  };

  // Truncate subject if too long
  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="border-top p-2 bg-light">
      <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-1">
          <div className="small text-body-secondary mb-1">Selected thread</div>
          <div 
            className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded border bg-white"
            style={{ maxWidth: '100%' }}
          >
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-semibold small text-truncate" title={selectedThread.subject}>
                {truncateText(selectedThread.subject)}
              </div>
              <div className="text-body-secondary small text-truncate" title={selectedThread.from}>
                {truncateText(selectedThread.from, 30)}
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              aria-label="Clear selection"
              onClick={handleRemove}
              style={{ fontSize: '0.75rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
