export interface SummaryRequest {
  message: string;
}

export interface SummaryResponse {
  summary: string;
  key_points: string[];
  detected_language: string;
  was_translated: boolean;
  original_message: string;
}

export async function summarizeEmail(message: string): Promise<SummaryResponse> {
  const response = await fetch('http://127.0.0.1:8002/api/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
    } as SummaryRequest),
  });

  if (!response.ok) {
    throw new Error(`Summary API failed: ${response.statusText}`);
  }

  return response.json();
}
