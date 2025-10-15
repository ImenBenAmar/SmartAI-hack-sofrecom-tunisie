import InboxItem from "./InboxItem";

export type InboxMessage = {
  id: string;
  threadId?: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  unread?: boolean;
  threadCount?: number;
  unreadInThread?: number;
};

export default function InboxList({ items }: { items: InboxMessage[] }) {
  return (
    <div className="list-group">
      {items.map((m) => (
        <InboxItem key={m.threadId || m.id} message={m} />
      ))}
    </div>
  );
}
