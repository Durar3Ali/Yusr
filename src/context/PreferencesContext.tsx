import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Preferences } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/lib/api/users';
import { getPreferences, dbPreferencesToApp } from '@/lib/api/preferences';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from '@/lib/constants';

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const { user } = useAuth();

  // On mount: check session — only load localStorage if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
        setPreferencesState(DEFAULT_PREFERENCES);
        return;
      }
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load preferences from localStorage:', error);
      }
    });
  }, []);

  // When user is logged in, fetch and apply server preferences app-wide
  useEffect(() => {
    if (!user) return;
    getMe()
      .then(me => (me ? getPreferences(me.id) : null))
      .then(data => {
        if (!data) return;
        setPreferencesState(dbPreferencesToApp(data));
      })
      .catch(() => {
        // Leave current state (defaults or localStorage) on failure
      });
  }, [user]);

  // On SIGNED_OUT: reset in-memory state and clear localStorage immediately
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
        setPreferencesState(DEFAULT_PREFERENCES);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }, [preferences]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  const setPreferences = (partial: Partial<Preferences>) => {
    setPreferencesState(prev => ({ ...prev, ...partial }));
  };

  const resetPreferences = () => {
    setPreferencesState(DEFAULT_PREFERENCES);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
