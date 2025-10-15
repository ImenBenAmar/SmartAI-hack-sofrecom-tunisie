/**
 * RAG (Retrieval-Augmented Generation) API Client
 * Handles document vectorization and question answering
 */

const API_BASE_URL = 'http://127.0.0.1:8002';

// ======================= REQUEST/RESPONSE TYPES =======================

export interface RAGQuestionRequest {
  question: string;
  text_content: string;
  top_k?: number;
  force_recreate?: boolean;
  apply_correction?: boolean;
}

export interface RAGAnswerResponse {
  question: string;
  answer: string;
  raw_answer?: string | null;
  context_chunks: string[];
  total_chunks: number;
  generation_time_seconds: number;
}

// ======================= API FUNCTIONS =======================

/**
 * Ask a question about document content using RAG
 * @param question - The question to ask
 * @param textContent - The document text content
 * @param topK - Number of similar chunks to retrieve (default: 3)
 * @param forceRecreate - Force recreate vectorstore (default: false)
 * @param applyCorrection - Apply correction step to answer (default: true)
 * @returns Answer with context and metadata
 */
export async function askQuestion(
  question: string,
  textContent: string,
  topK: number = 3,
  forceRecreate: boolean = false,
  applyCorrection: boolean = true
): Promise<RAGAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rag/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      text_content: textContent,
      top_k: topK,
      force_recreate: forceRecreate,
      apply_correction: applyCorrection,
    } as RAGQuestionRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`RAG query failed: ${errorData.detail || response.statusText}`);
  }

  return response.json();
}
