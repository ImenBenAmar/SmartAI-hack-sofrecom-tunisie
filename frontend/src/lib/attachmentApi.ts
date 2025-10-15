/**
 * Attachment Processing API Client
 * Handles attachment processing and text extraction
 */

const API_BASE_URL = 'http://127.0.0.1:8002';

// ======================= REQUEST/RESPONSE TYPES =======================

export interface AttachmentProcessRequest {
  file_content_base64: string; // Base64 encoded file content
  filename: string;
}

export interface AttachmentMetadata {
  filename: string;
  size_kb: number;
  mime_type: string;
  extension: string;
  created_date: string;
  modified_date: string;
}

export interface AttachmentProcessResponse {
  processing_successful: boolean;
  metadata: AttachmentMetadata;
  extracted_text: string;
  text_length: number;
  error?: string;
}

// ======================= API FUNCTIONS =======================

/**
 * Process an attachment and extract text
 * @param fileContent - Base64 encoded file content
 * @param filename - Original filename
 * @returns Processing result with extracted text
 */
export async function processAttachment(
  fileContent: string,
  filename: string
): Promise<AttachmentProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/attachment/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_content_base64: fileContent,
      filename,
    } as AttachmentProcessRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Attachment processing failed: ${errorData.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * Download attachment from Gmail API and convert to base64
 * @param messageId - Gmail message ID
 * @param attachmentId - Gmail attachment ID
 * @returns Base64 encoded file content
 */
export async function downloadAttachmentAsBase64(
  messageId: string,
  attachmentId: string
): Promise<string> {
  const response = await fetch(`/api/gmail/messages/${messageId}/attachments/${attachmentId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to download attachment: ${error.error || response.statusText}`);
  }

  // Get the binary data as ArrayBuffer
  const arrayBuffer = await response.arrayBuffer();
  
  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return base64;
}
