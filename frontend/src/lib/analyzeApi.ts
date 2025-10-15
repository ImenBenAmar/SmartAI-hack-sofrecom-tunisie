export interface AnalyzeRequest {
  message: string;
}

export interface AnalyzeResponse {
  main_subject: string;
  short_summary: string;
  email_type: "Meeting Planning" | "Action Request" | "Information" | "Reply" | "Report" | "Social" | "Event" | "Other";
  participants: string[];
  sentiment: "Positive" | "Negative" | "Neutral";
  urgency: {
    is_urgent: boolean;
    justification: string;
  };
  original_message: string;
}

export async function analyzeEmail(message: string): Promise<AnalyzeResponse> {
  const response = await fetch('http://127.0.0.1:8002/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
    } as AnalyzeRequest),
  });

  if (!response.ok) {
    throw new Error(`Analyze API failed: ${response.statusText}`);
  }

  return response.json();
}
