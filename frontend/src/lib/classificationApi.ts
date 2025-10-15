/**
 * Document Classification API Client
 * Handles theme detection and classification
 */

const API_BASE_URL = 'http://127.0.0.1:8002';

// ======================= REQUEST/RESPONSE TYPES =======================

export interface ClassificationRequest {
  text_content: string;
  num_themes?: number; // Default: 5, Range: 2-15
}

export interface ThemeInfo {
  theme_id: number;
  description: string;
  representative_text: string;
}

export interface ClassificationResponse {
  themes: ThemeInfo[];
  total_themes: number;
  total_chunks: number;
  processing_time_seconds: number;
}

// ======================= API FUNCTIONS =======================

/**
 * Classify document and detect themes using ML clustering
 * @param textContent - Extracted text content from document
 * @param numThemes - Number of themes to detect (2-15, default: 5)
 * @returns Classification results with detected themes
 */
export async function classifyDocument(
  textContent: string,
  numThemes: number = 5
): Promise<ClassificationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/classification/themes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_content: textContent,
      num_themes: Math.max(2, Math.min(15, numThemes)), // Clamp between 2-15
    } as ClassificationRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Classification failed: ${errorData.detail || response.statusText}`);
  }

  return response.json();
}
