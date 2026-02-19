import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences, Theme, FontFamily, LeadBoldStrength, LanguageHint } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/lib/api/users';
import { getPreferences } from '@/lib/api/preferences';

const STORAGE_KEY = 'dyslexia-reader-preferences';

const defaultPreferences: Preferences = {
  fontFamily: 'Lexend',
  fontSize: 18,
  lineSpacing: 1.8,
  letterSpacing: 0.05,
  theme: 'light-yellow',
  leadBold: 'medium',
  groupSize: 3,
  langHint: 'auto',
};

interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (prefs: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Always start with defaults; the useEffect below will load from localStorage
  // only if a valid session exists, avoiding stale values for logged-out users.
  const [preferences, setPreferencesState] = useState<Preferences>(defaultPreferences);
  const { user } = useAuth();

  // On mount: check session — only load localStorage if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        localStorage.removeItem(STORAGE_KEY);
        setPreferencesState(defaultPreferences);
        return;
      }
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferencesState({ ...defaultPreferences, ...parsed });
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
        const fontFamily = data.font_family === 'System Default' ? 'System' : (data.font_family as FontFamily);
        setPreferencesState({
          theme: data.theme as Theme,
          fontFamily,
          fontSize: data.font_size,
          lineSpacing: data.line_spacing,
          letterSpacing: data.letter_spacing,
          leadBold: data.lead_bold as LeadBoldStrength,
          groupSize: data.group_size,
          langHint: data.lang_hint as LanguageHint,
        });
      })
      .catch(() => {
        // Leave current state (defaults or localStorage) on failure
      });
  }, [user]);

  // On SIGNED_OUT: reset in-memory state and clear localStorage immediately
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        setPreferencesState(defaultPreferences);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
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
    setPreferencesState(defaultPreferences);
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
