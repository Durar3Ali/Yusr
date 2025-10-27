import { LanguageHint } from '@/types';

/**
 * Detects if the given text contains predominantly RTL (Arabic) characters
 * Uses Unicode ranges for Arabic script (0x0600-0x06FF, 0x0750-0x077F, 0xFB50-0xFDFF, 0xFE70-0xFEFF)
 */
export function detectRTL(text: string): boolean {
  if (!text || text.length === 0) return false;

  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const arabicMatches = text.match(arabicRegex);
  
  if (!arabicMatches) return false;

  // Consider text RTL if more than 30% is Arabic script
  const arabicCharCount = arabicMatches.length;
  const totalChars = text.replace(/\s/g, '').length;
  
  return totalChars > 0 && (arabicCharCount / totalChars) > 0.3;
}

/**
 * Returns the text direction based on content analysis and language hint
 */
export function directionFor(text: string, langHint: LanguageHint): 'rtl' | 'ltr' {
  if (langHint === 'ar') return 'rtl';
  if (langHint === 'en') return 'ltr';
  
  // Auto-detect
  return detectRTL(text) ? 'rtl' : 'ltr';
}

/**
 * Checks if a single word is likely Arabic
 */
export function isArabicWord(word: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(word);
}
