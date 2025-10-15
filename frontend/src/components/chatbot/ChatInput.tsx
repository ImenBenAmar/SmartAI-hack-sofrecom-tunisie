"use client";

import { useState, FormEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="border-top p-2">
      <form className="input-group" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Type a message…" 
          aria-label="Chat message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        <button 
          className="btn btn-primary" 
          type="submit"
          disabled={disabled || !message.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
