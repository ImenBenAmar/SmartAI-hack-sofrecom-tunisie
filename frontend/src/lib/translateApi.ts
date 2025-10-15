// API endpoint for translation
const TRANSLATE_API_URL = 'http://127.0.0.1:8002/api/translate';

export interface TranslateRequest {
  subject: string;
  message: string;
}

export interface TranslateResponse {
  detected_language: string;
  subject_translated: string | null;
  message_translated: string | null;
  original_subject: string;
  original_message: string;
}

export async function translateEmail(subject: string, message: string): Promise<TranslateResponse> {
  const response = await fetch(TRANSLATE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      message
    })
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  return response.json();
}
