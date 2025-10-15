"use client";

import { useMemo } from "react";
import InboxList, { InboxMessage } from "./InboxList";
import type { InboxFilters } from "@/types/filters";

// ---------- UTILITÉ DE NORMALISATION ----------
function normalizeMessage(msg: Partial<InboxMessage>): InboxMessage {
  return {
    id: msg.id || "unknown-id",
    threadId: msg.threadId,
    subject: msg.subject || "(No subject)",
    from: msg.from || "Unknown sender",
    to: msg.to || "",
    date: msg.date || "",
    snippet: msg.snippet || "",
    unread: msg.unread ?? false,
    threadCount: msg.threadCount ?? 1,
    unreadInThread: msg.unreadInThread ?? 0,
  };
}

interface InboxListSectionProps {
  messages: Partial<InboxMessage>[]; // accepte messages incomplets
  currentPage: number;
  pageSize: number;
  activeFilters: InboxFilters;
  onChangePageSize: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function InboxListSection({
  messages,
  currentPage,
  pageSize,
  activeFilters,
  onChangePageSize,
  onPrevPage,
  onNextPage,
}: InboxListSectionProps) {
  // Normalisation
  const normalizedMessages = useMemo(
    () => messages.map(normalizeMessage),
    [messages]
  );

  // Pagination
  const paginatedMessages = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return normalizedMessages.slice(start, end);
  }, [normalizedMessages, currentPage, pageSize]);

  const totalPages = Math.ceil(normalizedMessages.length / pageSize);
  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, normalizedMessages.length);

  const renderPagination = () => (
    <div className="d-flex align-items-center gap-3">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={onPrevPage}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        «
      </button>
      <div className="text-body-secondary small">
        {normalizedMessages.length > 0 ? `${startIndex}–${endIndex} of ${normalizedMessages.length}` : '0–0'} 
        {activeFilters.enabled === false
          ? ' threads (filters disabled)'
          : (activeFilters.activeSenderGroups?.length > 0 || activeFilters.individualSenders?.length > 0 || activeFilters.dateRange || activeFilters.readStatus !== 'all' 
            ? ' (filtered)' 
            : ' threads')}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={onNextPage}
        disabled={!hasNext}
        aria-label="Next page"
      >
        »
      </button>
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="pageSize" className="form-label mb-0 text-body-secondary">
            Per page
          </label>
          <select
            id="pageSize"
            className="form-select form-select-sm w-auto"
            value={pageSize}
            onChange={onChangePageSize}
            aria-label="Emails per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        {renderPagination()}
      </div>

      {paginatedMessages.length === 0 ? (
        <p className="text-body-secondary">
          {activeFilters.activeSenderGroups?.length > 0 || activeFilters.individualSenders?.length > 0 || activeFilters.dateRange || activeFilters.readStatus !== 'all'
            ? 'No messages match your filters.'
            : 'No messages found.'}
        </p>
      ) : (
        <InboxList items={paginatedMessages} />
      )}

      <div className="mt-3 d-flex justify-content-end">
        {renderPagination()}
      </div>
    </>
  );
}
