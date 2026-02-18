/**
 * API client for chatbot backend endpoints.
 * Handles communication with the Python Flask backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// #region agent log
console.log('[DEBUG] API_BASE configured:', API_BASE);
// #endregion

export interface AssistantResponse {
  assistant_id: string;
  thread_id: string;
  vector_store_id: string;
  file_id: string;
}

export interface ChatMessageResponse {
  response: string;
}

export interface TranscribeResponse {
  text: string;
}

/**
 * Create a new OpenAI assistant with document as knowledge base.
 * 
 * @param payload - Either text content or PDF file
 * @returns Assistant and thread IDs
 */
export async function createAssistant(payload: {
  text?: string;
  pdfFile?: File;
  fileName?: string;
}): Promise<AssistantResponse> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat.ts:29',message:'createAssistant called',data:{hasText:!!payload.text,hasPdf:!!payload.pdfFile,fileName:payload.fileName,apiBase:API_BASE},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  
  const formData = new FormData();
  
  if (payload.pdfFile) {
    formData.append('pdf', payload.pdfFile);
  } else if (payload.text) {
    formData.append('text', payload.text);
    if (payload.fileName) {
      formData.append('file_name', payload.fileName);
    }
  } else {
    throw new Error('Either text or pdfFile must be provided');
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat.ts:47',message:'Calling API endpoint',data:{url:`${API_BASE}/api/assistant/create`},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  
  const response = await fetch(`${API_BASE}/api/assistant/create`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create assistant' }));
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat.ts:52',message:'API call failed',data:{status:response.status,error:error,url:`${API_BASE}/api/assistant/create`},timestamp:Date.now(),hypothesisId:'H3,H4'})}).catch(()=>{});
    // #endregion
    throw new Error(error.error || 'Failed to create assistant');
  }
  
  const result = await response.json();
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chat.ts:57',message:'API call success',data:{assistantId:result.assistant_id,threadId:result.thread_id},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  
  return result;
}

/**
 * Send a message to the assistant and get a response.
 * 
 * @param threadId - OpenAI thread ID
 * @param assistantId - OpenAI assistant ID
 * @param message - User's message
 * @returns Assistant's response
 */
export async function sendChatMessage(
  threadId: string,
  assistantId: string,
  message: string
): Promise<ChatMessageResponse> {
  const response = await fetch(`${API_BASE}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      thread_id: threadId,
      assistant_id: assistantId,
      message,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error || 'Failed to send message');
  }
  
  return response.json();
}

/**
 * Delete an assistant and its resources.
 * 
 * @param assistantId - OpenAI assistant ID
 * @param vectorStoreId - Optional vector store ID
 * @param fileId - Optional file ID
 */
export async function deleteAssistant(
  assistantId: string,
  vectorStoreId?: string,
  fileId?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (vectorStoreId) params.append('vector_store_id', vectorStoreId);
  if (fileId) params.append('file_id', fileId);
  
  const url = `${API_BASE}/api/assistant/${assistantId}${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete assistant' }));
    throw new Error(error.error || 'Failed to delete assistant');
  }
}

/**
 * Transcribe audio using OpenAI gpt-4o-mini-transcribe API.
 * 
 * @param audioBlob - Audio blob to transcribe
 * @param options.mimeType - MIME type of the blob, used to derive the file extension
 * @param options.prompt - Optional context string to improve accuracy (e.g. document keywords)
 * @param options.language - Optional BCP-47 language code; omit to auto-detect
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: { mimeType?: string; prompt?: string; language?: string } = {}
): Promise<TranscribeResponse> {
  const { mimeType, prompt, language } = options;

  // Derive a sensible filename so the backend knows the format
  const ext = mimeType?.includes('ogg') ? 'ogg'
    : mimeType?.includes('mp4') || mimeType?.includes('m4a') ? 'mp4'
    : mimeType?.includes('wav') ? 'wav'
    : 'webm';

  const formData = new FormData();
  formData.append('audio', audioBlob, `recording.${ext}`);
  if (language) formData.append('language', language);
  if (prompt) formData.append('prompt', prompt);

  const response = await fetch(`${API_BASE}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to transcribe audio' }));
    throw new Error(error.error || 'Failed to transcribe audio');
  }
  
  return response.json();
}

/**
 * Check if the backend is running.
 * 
 * @returns True if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
