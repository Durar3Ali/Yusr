import { supabase } from '@/lib/supabaseClient';

export interface UserData {
  id: number;
  full_name: string | null;
  email: string;
}

/**
 * Get current user's data from the users table
 * After supabase.auth.getUser(), fetch a row from public.users by auth_user_id
 */
export async function getMe(): Promise<UserData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update current user's data
 */
export async function updateMe(payload: { full_name?: string }): Promise<UserData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('auth_user_id', user.id)
    .select('id, full_name, email')
    .single();

  if (error) throw error;
  return data;
}

