"use client";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <div className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <div 
        className={`alert py-2 px-3 ${isUser ? 'alert-primary ms-auto' : 'alert-secondary'}`}
        style={{ maxWidth: '75%' }}
      >
        <div className="mb-0">{content}</div>
        {timestamp && (
          <div className="text-body-secondary small mt-1">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
