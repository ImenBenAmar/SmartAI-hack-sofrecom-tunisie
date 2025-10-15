import { NextRequest, NextResponse } from "next/server";
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

function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };
  return input.replace(
    /&(#\d+|#x[0-9a-fA-F]+|amp|lt|gt|quot|apos|#39);/g,
    (m, p1) => {
      if (p1 in named) return named[p1];
      if (p1.toLowerCase() === "#39") return "'";
      if (p1.startsWith("#x") || p1.startsWith("#X")) {
        const code = parseInt(p1.slice(2), 16);
        return String.fromCodePoint(isFinite(code) ? code : 0xfffd);
      }
      if (p1.startsWith("#")) {
        const code = parseInt(p1.slice(1), 10);
        return String.fromCodePoint(isFinite(code) ? code : 0xfffd);
      }
      return m;
    }
  );
}

function collectAttachments(payload: any, acc: any[] = []) {
  if (!payload) return acc;
  const { body, filename, mimeType, headers, parts } = payload;
  const attachmentId = body?.attachmentId;
  if (attachmentId) {
    const hdrs = new Map(
      (headers || []).map((h: any) => [String(h.name).toLowerCase(), String(h.value)] as const)
    );
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
  if (parts && Array.isArray(parts)) {
    for (const p of parts) collectAttachments(p, acc);
  }
  return acc;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Correction ici : await context.params
    const { id } = await context.params;

    const session = await getServerSession(authConfig as any);
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`;
    const res = await fetch(`${url}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Gmail get failed", detail: text }, { status: res.status });
    }

    const msg = await res.json();
    const headers = new Map(
      (msg.payload?.headers || []).map(
        (h: any) => [String(h.name).toLowerCase(), String(h.value)] as const
      )
    );
    const { text, html } = extractBody(msg.payload);
    const unread = Array.isArray(msg.labelIds) ? msg.labelIds.includes("UNREAD") : false;
    const attachments = collectAttachments(msg.payload);

    return NextResponse.json({
      id: msg.id,
      threadId: msg.threadId,
      subject: decodeHtmlEntities(String(headers.get("subject") || "(no subject)")),
      from: headers.get("from") || "",
      to: headers.get("to") || "",
      date: headers.get("date") || "",
      snippet: decodeHtmlEntities(String(msg.snippet || "")),
      unread,
      body: { text: text ? decodeHtmlEntities(text) : undefined, html },
      attachments,
      headers: Object.fromEntries(headers),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
