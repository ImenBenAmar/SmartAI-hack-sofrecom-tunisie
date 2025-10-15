import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import ThreadSelector from "@/components/inbox/ThreadSelector";
import MeetingDetection from "@/components/inbox/MeetingDetection";
import AttachmentProcessor from "@/components/inbox/AttachmentProcessor";
import AttachmentThemesBadge from "@/components/inbox/AttachmentThemesBadge";

export const dynamic = "force-dynamic";

async function getMessage(baseUrl: string, id: string) {
  const ck = await cookies();
  const cookieHeader = ck.toString();
  const res = await fetch(`${baseUrl}/api/gmail/messages/${id}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to load message");
  return res.json();
}

async function getThread(baseUrl: string, threadId: string) {
  const ck = await cookies();
  const cookieHeader = ck.toString();
  const res = await fetch(`${baseUrl}/api/gmail/threads/${threadId}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to load thread");
  return res.json();
}

export default async function InboxMessagePage({ params }: { params: { id: string } }) {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const data = await getMessage(baseUrl, params.id);
  const thread = data.threadId ? await getThread(baseUrl, data.threadId) : { messages: [data] };
  const messages = (thread.messages || []).slice().sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get the first message for thread info
  const firstMessage = messages[0];

  return (
    <div className="container py-3">
      {/* Auto-select this thread in the chatbot */}
      <ThreadSelector 
        threadId={data.threadId || params.id}
        subject={firstMessage?.subject || data.subject || "No subject"}
        from={firstMessage?.from || data.from || "Unknown sender"}
      />

      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/inbox">Inbox</a></li>
          <li className="breadcrumb-item active" aria-current="page">Message</li>
        </ol>
      </nav>

      {/* Meeting Detection Component */}
      <MeetingDetection messages={messages} />

      {/* Attachment Processor Component */}
      <AttachmentProcessor messages={messages} />

      {messages.map((m: any, idx: number) => {
        const date = m.date ? new Date(m.date).toLocaleString() : "";
        return (
          <div key={m.id} className="mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="mb-1 d-flex align-items-center gap-2">
                {m.subject}
                {m.unread && <span className="badge bg-warning text-dark">NEW</span>}
              </h4>
            </div>
            <div className="text-body-secondary mb-3">
              <div>From: {m.from}</div>
              {m.to && <div>To: {m.to}</div>}
              {date && <div>Date: {date}</div>}
            </div>

            <div className="card">
              <div className="card-body">
                {m.body?.html ? (
                  <div dangerouslySetInnerHTML={{ __html: m.body.html }} />
                ) : (
                  <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{m.body?.text || m.snippet}</pre>
                )}
              </div>
            </div>

            {Array.isArray(m.attachments) && m.attachments.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-2">Attachments</h6>
                <ul className="list-group">
                  {m.attachments.map((att: any, aidx: number) => (
                    <li key={`${att.attachmentId}-${aidx}`} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <div>
                          <span className="me-2 badge bg-secondary">{att.mimeType?.split("/")[1] || "file"}</span>
                          <span className="fw-semibold">{att.filename}</span>
                          {att.size ? <span className="ms-2 text-body-secondary">{Math.round(att.size / 1024)} KB</span> : null}
                        </div>
                        <AttachmentThemesBadge messageId={m.id} attachmentId={att.attachmentId} />
                      </div>
                      <a
                        className="btn btn-sm btn-outline-primary"
                        href={`/api/gmail/messages/${m.id}/attachments/${att.attachmentId}`}
                        download={att.filename || undefined}
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {idx < messages.length - 1 && <hr className="mt-4" />}
          </div>
        );
      })}
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    const data = await getMessage(baseUrl, params.id);
    return { title: data.subject || "Message" };
  } catch {
    return { title: "Message" };
  }
}
