import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using the bundled worker file
// Use Vite's special syntax to get the worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Extracts text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise resolving to the extracted text
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    const textParts: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Aggregate text items
      const pageText = textContent.items
        .map((item: any) => {
          // Handle text items
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      textParts.push(pageText);
    }
    
    // Join all pages with double newline
    let fullText = textParts.join('\n\n');
    
    // Normalize whitespace
    fullText = fullText.replace(/\s+/g, ' ');
    
    // Restore paragraph breaks (heuristic: periods followed by capital letters)
    fullText = fullText.replace(/\. ([A-Z])/g, '.\n\n$1');
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
