"use client";

import type { InboxMessage } from "@/components/inbox/InboxList";
import Link from "next/link";
import { useChatbot } from "@/components/chatbot/ChatbotContext";

export default function InboxItem({ message }: { message: InboxMessage }) {
  const { subject, from, date, snippet, unread, threadCount, unreadInThread } = message;
  const { isOpen, selectedThread, setSelectedThread } = useChatbot();
  const isSelected = selectedThread?.id === message.id;

  // ---------- PARSE DATE ----------
  function parseDate(date: string | number | null | undefined): Date | null {
    if (!date) return null;

    if (typeof date === "number") return new Date(date);

    // Tente parsing direct
    let d = new Date(date);
    if (!isNaN(d.getTime())) return d;

    // Format DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
    if (match) {
      const [, day, month, year, hh, mm, ss] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hh ? Number(hh) : 0,
        mm ? Number(mm) : 0,
        ss ? Number(ss) : 0
      );
    }

    // Format Gmail "Fri Oct 10, 2025 2:30am"
    const gmailMatch = date.match(/[A-Za-z]{3} [A-Za-z]{3} \d{1,2}, \d{4} \d{1,2}:\d{2}[ap]m/);
    if (gmailMatch) {
      d = new Date(gmailMatch[0]);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  }

  const displayDate = parseDate(date);

  // ---------- EXTRACT EMAIL FROM 'FROM' ----------
  function extractEmail(sender: string | undefined): string {
    if (!sender) return "Unknown sender";
    const match = sender.match(/<(.+)>/);
    return match ? match[1] : sender;
  }

  const senderEmail = extractEmail(from);

  const itemClasses = `list-group-item list-group-item-action py-3 ${
    unread ? "bg-white text-dark" : "bg-body-secondary"
  }`;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSelected) {
      setSelectedThread(null);
    } else {
      setSelectedThread({
        id: message.id,
        subject: message.subject,
        from: message.from,
      });
    }
  };

  const handleCheckboxContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Link
      href={`/inbox/${message.id}`}
      className={itemClasses}
      aria-label={unread ? "Unread message" : undefined}
    >
      <div className="d-flex w-100 gap-2">
        {isOpen && (
          <div
            className="d-flex align-items-start pt-1"
            onClick={handleCheckboxContainerClick}
          >
            <input
              type="checkbox"
              className="form-check-input mt-0"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select thread for chatbot"
            />
          </div>
        )}
        <div className="flex-grow-1">
          <div className="d-flex w-100 justify-content-between align-items-center">
            <div className="d-flex flex-column">
              {/* Objet et Envoyeur */}
              <h6 className={`mb-0 ${unread ? "fw-bold" : "fw-normal"}`}>{subject}</h6>
              <small className="text-body-secondary">From: {senderEmail}</small>
            </div>
            {/* Date */}
            <small className="text-body-secondary">
              {displayDate ? displayDate.toLocaleString() : "Unknown date"}
            </small>
          </div>
          {/* Extrait du mail */}
          <p className="mb-1 text-body-secondary mt-1">{snippet}</p>
          <div className="d-flex justify-content-between align-items-center">
            {typeof unreadInThread === "number" && unreadInThread > 0 && (
              <small className="badge bg-warning text-dark">{unreadInThread} unread</small>
            )}
            {typeof threadCount === "number" && threadCount > 1 && (
              <small className="badge bg-secondary">{threadCount} in thread</small>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
