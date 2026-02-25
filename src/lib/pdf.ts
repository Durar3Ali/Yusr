import * as pdfjsLib from 'pdfjs-dist';

const PDF_BACKEND_URL =
  (import.meta.env.VITE_PDF_BACKEND_URL as string | undefined) ?? 'http://localhost:8000';
const BACKEND_TIMEOUT_MS = 30_000;

// Configure worker using the bundled worker file
// Use Vite's special syntax to get the worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Extracts text from a PDF via the Python backend (PyMuPDF).
 * @param file - The PDF file to extract text from
 * @returns Promise resolving to the extracted text
 * @throws On network error or non-200 response
 */
export async function extractPdfTextViaBackend(file: File): Promise<string> {
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

/**
 * Extracts text content from a PDF file. Tries the Python backend first for
 * better Arabic/RTL and ligature support; falls back to client-side pdfjs-dist
 * if the backend is unavailable.
 * @param file - The PDF file to extract text from
 * @returns Promise resolving to the extracted text
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    return await extractPdfTextViaBackend(file);
  } catch (backendError) {
    console.warn('Backend PDF extraction unavailable, falling back to client-side:', backendError);
  }
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const textParts: string[] = [];

    // Extract text from each page, preserving line order via y-coordinates
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // pdfjs TextItem exposes `width` (signed — negative for RTL runs) in
      // addition to the origin transform. We need it to compute both edges of
      // each item so combining diacritics can be attached to the nearest edge.
      type PdfItem = { str: string; transform: number[]; width: number };
      const items = textContent.items as PdfItem[];

      // Group items by y-coordinate with a tolerance window so that Arabic
      // diacritics and ligature fragments positioned a few units above/below
      // the main baseline are merged into the same visual line instead of
      // becoming isolated lines of their own.
      const Y_TOLERANCE = 4; // PDF units (~px at 72 dpi)
      const lineMap = new Map<number, Array<{ str: string; x: number; width: number }>>();
      const bucketKeys: number[] = [];

      const getYBucket = (y: number): number => {
        const close = bucketKeys.find((k) => Math.abs(k - y) <= Y_TOLERANCE);
        if (close !== undefined) return close;
        bucketKeys.push(y);
        return y;
      };

      for (const item of items) {
        if (!item.str) continue;
        const rawY = item.transform[5];
        const x = item.transform[4];
        const y = getYBucket(rawY);
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y)!.push({ str: item.str, x, width: item.width });
      }

      const RTL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;

      // Matches strings that consist entirely of Arabic combining diacritical
      // marks (harakat, shadda, tanwin, etc.). These have no meaningful x
      // origin of their own — their PDF position is wherever the font drew the
      // glyph overlay, which is often offset from the logical text stream order.
      const COMBINING_ONLY =
        /^[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+$/;

      // Sort lines top-to-bottom (descending y). Within each line:
      //   1. Separate combining-only items from regular text items.
      //   2. Sort regular items in reading order (RTL → descending x).
      //   3. Attach each combining mark to whichever regular item's EDGE is
      //      geometrically closest. Using both edges (item.x and item.x+width)
      //      instead of just the origin avoids the common Arabic mis-attachment
      //      where a tanwin drawn above the last letter of a long word is
      //      incorrectly snapped to a nearby short standalone letter.
      const sortedLines = Array.from(lineMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([, lineItems]) => {
          const lineStr = lineItems.map((i) => i.str).join('');
          const isRtl = RTL_RE.test(lineStr);

          const regular = lineItems.filter((i) => !COMBINING_ONLY.test(i.str));
          const combining = lineItems.filter((i) => COMBINING_ONLY.test(i.str));

          regular.sort((a, b) => (isRtl ? b.x - a.x : a.x - b.x));

          for (const mark of combining) {
            if (regular.length === 0) {
              regular.push(mark);
              continue;
            }
            let nearestIdx = 0;
            let minDist = Infinity;
            for (let j = 0; j < regular.length; j++) {
              const it = regular[j];
              // width is signed (negative for RTL), so these are the two edges.
              const dist = Math.min(
                Math.abs(it.x - mark.x),
                Math.abs(it.x + it.width - mark.x)
              );
              if (dist < minDist) {
                minDist = dist;
                nearestIdx = j;
              }
            }
            regular[nearestIdx] = {
              ...regular[nearestIdx],
              str: regular[nearestIdx].str + mark.str,
            };
          }

          return regular.map((i) => i.str).join('');
        });

      textParts.push(sortedLines.join('\n'));
    }

    // Join pages with a blank line separator
    let fullText = textParts.join('\n\n');

    // Collapse runs of spaces/tabs within lines (never touches newlines)
    fullText = fullText.replace(/[^\S\n]+/g, ' ');

    // Collapse 3+ consecutive newlines to a paragraph break
    fullText = fullText.replace(/\n{3,}/g, '\n\n');

    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
