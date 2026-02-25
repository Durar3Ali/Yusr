import type { FontFamily, Theme, LeadBoldStrength, LanguageHint, Preferences } from '@/types';

export const STORAGE_KEYS = {
  PREFERENCES: 'dyslexia-reader-preferences',
} as const;

export const FONT_OPTIONS: Array<{ value: FontFamily; label: string }> = [
  { value: 'Lexend', label: 'Lexend' },
  { value: 'Comic Neue', label: 'Comic Neue' },
  { value: 'Atkinson Hyperlegible', label: 'Atkinson Hyperlegible' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'System', label: 'System Default' },
];

export const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'light-yellow', label: 'Light Yellow' },
  { value: 'light-blue', label: 'Light Blue' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
];

export const LEAD_BOLD_OPTIONS: Array<{ value: LeadBoldStrength; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

export const LANG_HINT_OPTIONS: Array<{ value: LanguageHint; label: string }> = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
];

export const DEFAULT_PREFERENCES: Preferences = {
  fontFamily: 'Lexend',
  fontSize: 18,
  lineSpacing: 1.8,
  letterSpacing: 0.05,
  theme: 'light-yellow',
  leadBold: 'medium',
  groupSize: 3,
  langHint: 'auto',
};
