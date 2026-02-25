import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

/** Fetch the client's public IP address via ipify. */
export async function getUserIP(): Promise<string> {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return data.ip as string;
}

/**
 * Check whether the given email + IP combination is currently rate-limited.
 * Returns true if the user should be blocked, false otherwise.
 */
export async function checkRateLimit(email: string, ip: string): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', { p_email: email, p_ip: ip });
  return Boolean(data);
}

/** Record a failed login attempt for the given email + IP. */
export async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  await supabase.rpc('record_failed_attempt', { p_email: email, p_ip: ip });
}

/** Reset the failed-attempt counter on successful login. */
export async function resetRateLimit(email: string, ip: string): Promise<void> {
  await supabase.rpc('reset_rate_limit', { p_email: email, p_ip: ip });
}

export interface SignInResult {
  error: AuthError | null;
}

/**
 * Sign in with email + password.
 * Also handles rate-limit recording: records a failed attempt on error,
 * resets the counter on success.
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ?? null };
}

export interface SignUpOptions {
  redirectTo?: string;
  name?: string;
}

export interface SignUpResult {
  error: AuthError | null;
}

/** Sign up with email + password, optionally passing a display name. */
export async function signUp(
  email: string,
  password: string,
  options: SignUpOptions = {}
): Promise<SignUpResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options.redirectTo,
      data: options.name ? { name: options.name } : undefined,
    },
  });
  return { error: error ?? null };
}
