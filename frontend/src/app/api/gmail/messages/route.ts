import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth/config";

type GmailThreadsListResponse = {
  threads?: { id: string; snippet?: string; historyId?: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: { name: string; value: string }[];
  };
};

function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };
  return input.replace(/&(#\d+|#x[0-9a-fA-F]+|amp|lt|gt|quot|apos|#39);/g, (m, p1) => {
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
  });
}

export async function GET(req: Request) {
  try {
    // ✅ Auth
    const session = await getServerSession(authConfig as any);
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Récupération des paramètres
    const url = new URL(req.url);
    const pageToken = url.searchParams.get("pageToken");
    const maxResults = url.searchParams.get("maxResults") || "10"; // 👈 max 10 pour plus de rapidité
    const gmailQuery = url.searchParams.get("q");

    // ✅ Requête threads Gmail
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/threads");
    listUrl.searchParams.set("maxResults", maxResults);
    listUrl.searchParams.set("labelIds", "INBOX");
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);
    if (gmailQuery) listUrl.searchParams.set("q", gmailQuery);

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!listRes.ok) {
      const text = await listRes.text();
      return NextResponse.json(
        { error: "Gmail threads list failed", detail: text },
        { status: listRes.status }
      );
    }

    const list = (await listRes.json()) as GmailThreadsListResponse;
    const threadIds = list.threads?.map((t) => t.id) || [];

    // ✅ Requêtes parallèles pour chaque thread
    const threadPromises = threadIds.map(async (tid) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${tid}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }
      );
      if (!res.ok) return null;
      const threadJson = await res.json() as { messages?: GmailMessage[]; id: string };

      const msgs = threadJson.messages ?? [];
      if (msgs.length === 0) return null;

      // ✅ Sélection du message le plus ancien
      const oldest = msgs.reduce((a, b) =>
        parseInt(a.internalDate || "0") <= parseInt(b.internalDate || "0") ? a : b
      );

      const headers = new Map(
        (oldest.payload?.headers || []).map((h) => [h.name.toLowerCase(), h.value])
      );

      const unreadCount = msgs.filter(
        (m) => Array.isArray(m.labelIds) && m.labelIds.includes("UNREAD")
      ).length;

      return {
        id: oldest.id,
        threadId: threadJson.id,
        subject: decodeHtmlEntities(headers.get("subject") || "(no subject)"),
        from: headers.get("from") || "",
        to: headers.get("to") || "",
        date: headers.get("date") || "",
        snippet: decodeHtmlEntities(oldest.snippet || ""),
        unread: unreadCount > 0,
        threadCount: msgs.length,
        unreadInThread: unreadCount,
      };
    });

    const messages = (await Promise.all(threadPromises)).filter(Boolean);

    return NextResponse.json({
      messages,
      nextPageToken: list.nextPageToken || null,
      total: messages.length,
      totalThreads: list.resultSizeEstimate ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
