import { Token, RenderOptions, LeadBoldStrength, LanguageHint } from '@/types';
import { isArabicWord } from './rtl';

/**
 * Normalizes text by trimming, collapsing excess spaces, and normalizing newlines
 */
export function normalize(text: string): string {
  if (!text) return '';
  
  // Trim overall
  let normalized = text.trim();
  
  // Collapse multiple spaces into one
  normalized = normalized.replace(/[ \t]+/g, ' ');
  
  // Normalize line endings
  normalized = normalized.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/\r/g, '\n');
  
  // Keep double newlines as paragraph breaks, collapse more than 2 into 2
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  return normalized;
}

/**
 * Tokenizes text into words, spaces, and newlines
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  
  if (!text) return tokens;
  
  let currentPos = 0;
  const len = text.length;
  
  while (currentPos < len) {
    const char = text[currentPos];
    
    // Check for newlines
    if (char === '\n') {
      // Count consecutive newlines
      let newlineCount = 0;
      while (currentPos < len && text[currentPos] === '\n') {
        newlineCount++;
        currentPos++;
      }
      
      // Emit newline token (double newline = paragraph break)
      tokens.push({
        type: 'newline',
        value: newlineCount >= 2 ? '\n\n' : '\n'
      });
      continue;
    }
    
    // Check for spaces
    if (char === ' ' || char === '\t') {
      let spaces = '';
      while (currentPos < len && (text[currentPos] === ' ' || text[currentPos] === '\t')) {
        spaces += text[currentPos];
        currentPos++;
      }
      tokens.push({
        type: 'space',
        value: ' ' // Normalize to single space
      });
      continue;
    }
    
    // Must be part of a word
    let word = '';
    while (currentPos < len) {
      const c = text[currentPos];
      if (c === ' ' || c === '\t' || c === '\n') break;
      word += c;
      currentPos++;
    }
    
    if (word) {
      tokens.push({
        type: 'word',
        value: word
      });
    }
  }
  
  return tokens;
}

/**
 * Applies lead-bold formatting to a word based on language and strength
 */
export function leadBoldToken(
  word: string,
  strength: LeadBoldStrength,
  lang: LanguageHint
): string {
  if (strength === 'off' || !word) return word;
  
  const isArabic = lang === 'ar' || (lang === 'auto' && isArabicWord(word));
  
  if (isArabic) {
    // For Arabic, handle the definite article prefix "ال"
    let effectiveWord = word;
    let prefix = '';
    
    if (word.startsWith('ال')) {
      prefix = 'ال';
      effectiveWord = word.substring(2);
    }
    
    if (effectiveWord.length === 0) return word;
    
    // Determine bold length for Arabic
    let boldLen = 1;
    if (effectiveWord.length >= 4) {
      boldLen = 2;
    }
    
    if (strength === 'short') boldLen = Math.max(1, boldLen - 1);
    if (strength === 'strong') boldLen = Math.min(effectiveWord.length, boldLen + 1);
    
    const boldPart = effectiveWord.substring(0, boldLen);
    const rest = effectiveWord.substring(boldLen);
    
    return `${prefix}<strong>${boldPart}</strong>${rest}`;
  } else {
    // English/Latin script
    const len = word.length;
    let boldLen = 1;
    
    if (len >= 1 && len <= 3) boldLen = 1;
    else if (len >= 4 && len <= 6) boldLen = 2;
    else if (len >= 7) boldLen = 3;
    
    // Adjust based on strength
    if (strength === 'short') boldLen = Math.max(1, boldLen - 1);
    if (strength === 'strong') boldLen = Math.min(len, boldLen + 1);
    
    const boldPart = word.substring(0, boldLen);
    const rest = word.substring(boldLen);
    
    return `<strong>${boldPart}</strong>${rest}`;
  }
}

/**
 * Renders tokens into HTML with grouping and lead-bold formatting
 */
export function renderHtml(tokens: Token[], opts: RenderOptions): string {
  const { groupSize, lang, leadBold } = opts;
  
  let html = '';
  let wordIndex = 0;
  let inParagraph = false;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'newline') {
      // Close paragraph if open
      if (inParagraph) {
        html += '</p>';
        inParagraph = false;
      }
      
      // Double newline creates paragraph break
      if (token.value === '\n\n') {
        // Next word will start a new paragraph
      } else {
        // Single newline - just a line break within paragraph
        // We'll treat it as continuing the same paragraph
      }
      continue;
    }
    
    if (token.type === 'space') {
      html += ' ';
      continue;
    }
    
    if (token.type === 'word') {
      // Open paragraph if needed
      if (!inParagraph) {
        html += '<p>';
        inParagraph = true;
      }
      
      // Determine group class
      const groupNum = Math.floor(wordIndex / groupSize);
      const groupClass = groupNum % 2 === 0 ? 'group-a' : 'group-b';
      
      // Apply lead-bold
      const formattedWord = leadBoldToken(token.value, leadBold, lang);
      
      html += `<span class="word ${groupClass}" data-idx="${wordIndex}">${formattedWord}</span>`;
      wordIndex++;
    }
  }
  
  // Close final paragraph if open
  if (inParagraph) {
    html += '</p>';
  }
  
  return html;
}
