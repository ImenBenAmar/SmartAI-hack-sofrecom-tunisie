import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth/config";

function decodeBase64Url(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(input, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(payload: any): { text?: string; html?: string } {
  if (!payload) return {};
  const { body, mimeType, parts } = payload;
  const data = body?.data ? decodeBase64Url(body.data) : undefined;
  const result: { text?: string; html?: string } = {};
  if (mimeType === "text/plain") result.text = data;
  if (mimeType === "text/html") result.html = data;
  if (parts && Array.isArray(parts)) {
    for (const p of parts) {
      const child = extractBody(p);
      result.text = result.text || child.text;
      result.html = result.html || child.html;
    }
  }
  return result;
}

function collectAttachments(payload: any, acc: any[] = []) {
  if (!payload) return acc;
  const { body, filename, mimeType, headers, parts } = payload;
  const attachmentId = body?.attachmentId;
  if (attachmentId) {
    const hdrs = new Map((headers || []).map((h: any) => [String(h.name).toLowerCase(), String(h.value)] as const));
    const disposition = hdrs.get("content-disposition") || "";
    const contentId = hdrs.get("content-id") || undefined;
    acc.push({
      attachmentId,
      filename: filename || "attachment",
      mimeType: mimeType || "application/octet-stream",
      size: body?.size || undefined,
      disposition,
      contentId,
    });
  }
  if (parts && Array.isArray(parts)) for (const p of parts) collectAttachments(p, acc);
  return acc;
}

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    // Await the params promise
    const { threadId } = await params;

    const session = await getServerSession(authConfig as any);
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get thread details
    const threadRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!threadRes.ok) {
      const text = await threadRes.text();
      return NextResponse.json({ error: "Thread fetch failed", detail: text }, { status: threadRes.status });
    }
    const thread = await threadRes.json();
    const messages = (thread.messages || []).map((m: any) => {
      const headers = new Map((m.payload?.headers || []).map((h: any) => [String(h.name).toLowerCase(), String(h.value)] as const));
      const { text, html } = extractBody(m.payload);
      const attachments = collectAttachments(m.payload);
      const unread = Array.isArray(m.labelIds) ? m.labelIds.includes("UNREAD") : false;
      return {
        id: m.id,
        threadId: m.threadId,
        subject: headers.get("subject") || "(no subject)",
        from: headers.get("from") || "",
        to: headers.get("to") || "",
        date: headers.get("date") || "",
        snippet: m.snippet || "",
        unread,
        body: { text, html },
        attachments,
      };
    });

    return NextResponse.json({ threadId, messages });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error", detail: String(e?.message || e) }, { status: 500 });
  }
}