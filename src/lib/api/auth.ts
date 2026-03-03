/**
 * Supabase wrapper
 */
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient'; //the client instance we created in Layer 1.

/**implements rate limiting mechanism using 
 * Supabase remote procedure calls (RPC)*/ 

//get the user's IP address via ipify.
export async function getUserIP(): Promise<string> {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return data.ip as string;
}

//T or F the given email + IP is rate-limited?
export async function checkRateLimit(email: string, ip: string): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', { p_email: email, p_ip: ip });
  return Boolean(data);
}

// increasing the count on failed login attempts
export async function recordFailedAttempt(email: string, ip: string): Promise<void> {
  await supabase.rpc('record_failed_attempt', { p_email: email, p_ip: ip });
}

// Reset the failed-attempt counter on successful login.
export async function resetRateLimit(email: string, ip: string): Promise<void> {
  await supabase.rpc('reset_rate_limit', { p_email: email, p_ip: ip });
}


/** Sign in & sign up functionality */
export interface SignInResult { //the app always knows what to expect
  error: AuthError | null; //an error object or null if successful
}

// Sign in with email + password.
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ?? null };
}

// Sign up
export interface SignUpOptions {
  redirectTo?: string;
  name: string;
}

export interface SignUpResult {
  error: AuthError | null;
}

// Sign up with email, password, & name
export async function signUp(
  email: string,
  password: string,
  options: SignUpOptions 
): Promise<SignUpResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options.redirectTo,
      data:  { name: options.name }
    },
  });
  return { error: error ?? null };
}
