const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * simple API client to bridge between the frontend & the backend
 * 1) send the text, 
 * 2) receive the raw audio bytes, 
 * 3) and turn them into human-friendly audio for thebrowser to play.
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
