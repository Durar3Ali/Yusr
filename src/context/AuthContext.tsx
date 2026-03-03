/**
 * Context-Provider Pattern 
 * Makes the auth state globally available to the entire app
 * 
*/

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthContextValue {
  user: User | null;
  session: Session | null; //The JWT token for the current session
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Creates the "container" for auth data.
 * */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * The actual provider: wraps the tree & inject the data.
 * */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener for auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    //checks if there is already a session saved from the last time the user visited the site.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
