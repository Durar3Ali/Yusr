const PDF_BACKEND_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
const BACKEND_TIMEOUT_MS = 120_000;

export async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const res = await fetch(`${PDF_BACKEND_URL}/extract-pdf`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || `Backend returned ${res.status}`);
    }

    const json = (await res.json()) as { text?: string };
    if (typeof json.text !== 'string') {
      throw new Error('Invalid response: missing text');
    }
    return json.text;
  } finally {
    clearTimeout(timeoutId);
  }
}
