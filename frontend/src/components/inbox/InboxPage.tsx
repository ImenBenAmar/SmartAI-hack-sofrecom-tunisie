"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { InboxMessage } from "./InboxList";
import InboxFilterSection from "./InboxFilterSection";
import InboxListSection from "./InboxListSection";
import type { InboxFilters } from "@/types/filters";

// ---------- UTILITÉ DE NORMALISATION ----------
function normalizeMessage(msg: Partial<InboxMessage>): InboxMessage {
  return {
    id: msg.id || "unknown-id",
    threadId: msg.threadId,
    subject: msg.subject || "(No subject)",
    from: msg.from || "Unknown sender",
    to: msg.to || "",
    date: msg.date || "", // date brute pour parseDate
    snippet: msg.snippet || "",
    unread: msg.unread ?? false,
    threadCount: msg.threadCount ?? 1,
    unreadInThread: msg.unreadInThread ?? 0,
  };
}

// ---------- EXTRACTION EMAIL ----------
const extractEmail = (from: string): string => {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
};

export default function InboxPage() {
  const { data: session } = useSession();
  const [allMessages, setAllMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<InboxFilters>({
    activeSenderGroups: [],
    individualSenders: [],
    readStatus: 'all',
  });
  const [senderGroupsMap, setSenderGroupsMap] = useState<Map<string, string[]>>(new Map());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);

  // ---------- FETCH MESSAGES ----------
  useEffect(() => {
    if (!session || hasFetched) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/gmail/messages?maxResults=100`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // Normalisation des messages dès le fetch
        const normalizedMessages: InboxMessage[] = (data.messages || []).map(normalizeMessage);

        setAllMessages(normalizedMessages);
        setHasFetched(true);
      } catch (e: any) {
        setError(e?.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [session, hasFetched]);

  // ---------- FILTRAGE ----------
  const filteredMessages = useMemo(() => {
    let result = [...allMessages];

    if (activeFilters.enabled === false) return result;

    const allFilterSenders: string[] = [];

    if (activeFilters.individualSenders?.length > 0) {
      allFilterSenders.push(...activeFilters.individualSenders);
    }

    if (activeFilters.activeSenderGroups?.length > 0) {
      activeFilters.activeSenderGroups.forEach(groupId => {
        const senders = senderGroupsMap.get(groupId);
        if (senders) allFilterSenders.push(...senders);
      });
    }

    if (allFilterSenders.length > 0) {
      result = result.filter(msg => {
        const fromEmail = extractEmail(msg.from);
        return allFilterSenders.some(sender =>
          fromEmail.toLowerCase().includes(sender.toLowerCase())
        );
      });
    }

    if (activeFilters.dateRange) {
      const startDate = new Date(activeFilters.dateRange.start).getTime();
      const endDate = new Date(activeFilters.dateRange.end).getTime() + 86400000; // inclure le dernier jour
      result = result.filter(msg => {
        const msgDate = new Date(msg.date).getTime();
        return msgDate >= startDate && msgDate <= endDate;
      });
    }

    if (activeFilters.readStatus === 'unread') {
      result = result.filter(msg => msg.unread);
    } else if (activeFilters.readStatus === 'read') {
      result = result.filter(msg => !msg.unread);
    }

    return result;
  }, [allMessages, activeFilters, senderGroupsMap]);

  const handleFiltersChange = (filters: InboxFilters, groupsMap: Map<string, string[]>) => {
    setActiveFilters(filters);
    setSenderGroupsMap(groupsMap);
    setCurrentPage(0); // reset page
  };

  const onChangePageSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    if (!newSize || newSize === pageSize) return;
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const goPrev = () => { if (currentPage > 0) setCurrentPage(p => p - 1); };
  const goNext = () => {
    const totalPages = Math.ceil(filteredMessages.length / pageSize);
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };

  // ---------- RENDER STATES ----------
  if (!session) {
    return (
      <div className="placeholder-wave">
        <span className="placeholder col-12" style={{ height: 8 }} />
        <span className="placeholder col-10 mt-2" style={{ height: 8 }} />
        <span className="placeholder col-8 mt-2" style={{ height: 8 }} />
      </div>
    );
  }

  if (error) return <div className="alert alert-warning">{error}</div>;
  if (loading) return (
    <div className="placeholder-wave">
      <span className="placeholder col-12" style={{ height: 8 }} />
      <span className="placeholder col-10 mt-2" style={{ height: 8 }} />
      <span className="placeholder col-8 mt-2" style={{ height: 8 }} />
    </div>
  );

  return (
    <>
      <InboxFilterSection onFiltersChange={handleFiltersChange} />
      <InboxListSection
        messages={filteredMessages}
        currentPage={currentPage}
        pageSize={pageSize}
        activeFilters={activeFilters}
        onChangePageSize={onChangePageSize}
        onPrevPage={goPrev}
        onNextPage={goNext}
      />
    </>
  );
}
