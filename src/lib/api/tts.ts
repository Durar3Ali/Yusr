const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Convert text to speech using the backend OpenAI TTS endpoint.
 * Returns a blob object URL pointing to the MP3 audio.
 * Caller is responsible for calling URL.revokeObjectURL() when done.
 *
 * @param text  - Text to synthesize (max 4096 characters per call)
 * @param voice - OpenAI voice name (default: alloy)
 */
export async function synthesizeSpeech(text: string, voice = 'alloy'): Promise<string> {
  const response = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'TTS failed' }));
    throw new Error(error.error || 'TTS failed');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
