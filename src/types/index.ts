export type Theme = 'light-yellow' | 'light-blue' | 'sepia' | 'dark';
export type FontFamily = 'Lexend' | 'Comic Neue' | 'Atkinson Hyperlegible' | 'Arial' | 'Verdana' | 'System';
export type LeadBoldStrength = 'short' | 'medium' | 'strong' | 'off';
export type LanguageHint = 'auto' | 'ar' | 'en';

export interface Preferences {
  fontFamily: FontFamily;
  fontSize: number; // px
  lineSpacing: number; // unitless line-height
  letterSpacing: number; // em
  theme: Theme;
  leadBold: LeadBoldStrength;
  groupSize: number; // integer >= 2
  langHint: LanguageHint;
}

export type TokenType = 'word' | 'space' | 'newline';

export interface Token {
  type: TokenType;
  value: string;
}

export interface RenderOptions {
  groupSize: number;
  lang: LanguageHint;
  leadBold: LeadBoldStrength;
}
