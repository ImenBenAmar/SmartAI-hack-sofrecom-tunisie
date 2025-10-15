import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth/config";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    // ✅ Déstructurer params en utilisant await
    const { id, attachmentId } = await context.params;

    const session = await getServerSession(authConfig as any);
    const accessToken = (session as any)?.accessToken as string | undefined;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${attachmentId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Attachment fetch failed", detail: text }, { status: res.status });
    }

    const data = await res.json(); // Gmail retourne { data: base64url, size }
    const base64 = String(data.data || "").replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(base64, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error", detail: String(e?.message || e) },
      { status: 500 }
    );
  }
}
