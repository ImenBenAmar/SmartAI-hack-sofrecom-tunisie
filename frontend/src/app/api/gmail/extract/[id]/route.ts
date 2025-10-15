// src/app/api/gmail/extract/[id]/route.ts (corrigé pour Next.js 15+)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth/config";
interface GmailHeader { name: string; value: string; }
interface GmailPayload { headers: GmailHeader[]; body?: { data?: string }; parts?: any[]; }
interface GmailMessage { payload: GmailPayload; }

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }  // Changement clé : params est une Promise
) {
  const session = await getServerSession(authConfig as any);
  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Await les params async
    const params = await context.params;  // Résout la Promise
    const id = params.id;  // Maintenant string

    // Fetch the thread or message
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",  // Évite cache en dev/prod
      }
    );

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Failed to fetch message: ${messageResponse.status} ${errorText}`);
    }

    const messageData = await messageResponse.json();
    
    // Extract subject
    const subjectHeader = messageData.payload.headers.find(
      (h: GmailHeader) => h.name.toLowerCase() === "subject"
    );
    const subject = subjectHeader?.value || "";

    // Extract message body
    let body = "";
    
    // Helper to decode base64url
    const decodeBase64Url = (str: string) => {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(base64, "base64").toString("utf-8");
    };
    // Extract sender
const fromHeader = messageData.payload.headers.find(
  (h: GmailHeader) => h.name.toLowerCase() === "from"
);
const sender = fromHeader?.value || "";

// Extract date
const dateHeader = messageData.payload.headers.find(
  (h: GmailHeader) => h.name.toLowerCase() === "date"
);
let date = dateHeader?.value || "";
if (date) {
  // Convertir en ISO pour le frontend
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    date = parsedDate.toISOString();
  } else {
    date = "Invalid Date";
  }
}


    // Helper to extract text from payload
    const extractText = (payload: any): string => {
      if (payload.body?.data) {
        return decodeBase64Url(payload.body.data);
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return decodeBase64Url(part.body.data);
          }
          if (part.parts) {
            const text = extractText(part);
            if (text) return text;
          }
        }
      }
      return "";
    };

    body = extractText(messageData.payload);

    return NextResponse.json({
      subject,
      message: body,
      id,
    });
 } catch (error: unknown) { // Remplace any par unknown
    const err = error as Error; // Cast safe
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}