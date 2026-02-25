import { supabase } from '@/lib/supabaseClient';
import type { Preferences } from '@/types';
import { DEFAULT_PREFERENCES } from '@/lib/constants';

/** DB row shape — snake_case as stored in Supabase */
export type DbPreferences = {
  font_family: string;
  font_size: number;
  line_spacing: number;
  letter_spacing: number;
  theme: string;
  lead_bold: string;
  group_size: number;
  lang_hint: string;
};

/**
 * Map a DB preferences row to the app-level Preferences model.
 * Provides a single place to validate/cast DB strings to typed unions.
 */
export function dbPreferencesToApp(db: DbPreferences): Preferences {
  return {
    fontFamily: db.font_family === 'System Default' ? 'System' : (db.font_family as Preferences['fontFamily']),
    fontSize: db.font_size,
    lineSpacing: db.line_spacing,
    letterSpacing: db.letter_spacing,
    theme: db.theme as Preferences['theme'],
    leadBold: db.lead_bold as Preferences['leadBold'],
    groupSize: db.group_size,
    langHint: db.lang_hint as Preferences['langHint'],
  };
}

/**
 * Build the DB upsert payload from app-level Preferences.
 * Centralises the camelCase → snake_case mapping so callers never
 * repeat it inline.
 */
export function preferencesToDbPayload(
  prefs: Preferences,
  userId: number
): DbPreferences & { user_id: number } {
  return {
    user_id: userId,
    theme: prefs.theme,
    font_family: prefs.fontFamily,
    font_size: prefs.fontSize,
    line_spacing: prefs.lineSpacing,
    letter_spacing: prefs.letterSpacing,
    lead_bold: prefs.leadBold,
    group_size: prefs.groupSize,
    lang_hint: prefs.langHint,
  };
}

/**
 * Get user's preferences from the preferences table.
 * Returns DEFAULT_PREFERENCES (as DbPreferences shape) if no row exists.
 */
export async function getPreferences(userId: number): Promise<DbPreferences> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // PGRST116 = no rows returned (user hasn't saved preferences yet)
  if (error && error.code === 'PGRST116') {
    return {
      font_family: DEFAULT_PREFERENCES.fontFamily,
      font_size: DEFAULT_PREFERENCES.fontSize,
      line_spacing: DEFAULT_PREFERENCES.lineSpacing,
      letter_spacing: DEFAULT_PREFERENCES.letterSpacing,
      theme: DEFAULT_PREFERENCES.theme,
      lead_bold: DEFAULT_PREFERENCES.leadBold,
      group_size: DEFAULT_PREFERENCES.groupSize,
      lang_hint: DEFAULT_PREFERENCES.langHint,
    };
  }

  if (error) throw error;
  return data;
}

/**
 * Upsert (insert or update) user preferences
 */
export async function upsertPreferences(
  prefs: DbPreferences & { user_id: number }
): Promise<DbPreferences> {
  const { data, error } = await supabase
    .from('preferences')
    .upsert(prefs, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
