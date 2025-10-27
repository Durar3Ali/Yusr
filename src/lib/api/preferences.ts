import { supabase } from '@/lib/supabaseClient';

export type Preferences = {
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
 * Get user's preferences from the preferences table
 * If not found, return defaults
 */
export async function getPreferences(userId: number): Promise<Preferences> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // PGRST116 = no rows returned (user hasn't saved preferences yet)
  if (error && error.code === 'PGRST116') {
    // Return default preferences
    return {
      font_family: 'Lexend',
      font_size: 18,
      line_spacing: 1.6,
      letter_spacing: 0.05,
      theme: 'light-yellow',
      lead_bold: 'medium',
      group_size: 3,
      lang_hint: 'auto'
    };
  }
  
  if (error) throw error;
  return data;
}

/**
 * Upsert (insert or update) user preferences
 */
export async function upsertPreferences(prefs: Preferences & { user_id: number }): Promise<Preferences> {
  const { data, error } = await supabase
    .from('preferences')
    .upsert(prefs, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

