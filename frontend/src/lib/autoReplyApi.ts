export interface AutoReplyRequest {
  message: string;
}

export interface AutoReplyResponse {
  reply: string;
  tone: "Professional" | "Casual" | "Formal";
  detected_language: string;
  was_translated: boolean;
  original_message: string;
}

export async function generateAutoReply(message: string): Promise<AutoReplyResponse> {
  const response = await fetch('http://127.0.0.1:8002/api/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
    } as AutoReplyRequest),
  });

  if (!response.ok) {
    throw new Error(`Auto-reply API failed: ${response.statusText}`);
  }

  return response.json();
}
