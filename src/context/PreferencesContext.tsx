import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Preferences } from '@/types';
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

  // Whenever the auth user changes, sync preferences from the appropriate source.
  useEffect(() => {
    if (!user) {
      // User signed out (or was never signed in) — clear persisted prefs and reset to defaults.
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
      setPreferencesState(DEFAULT_PREFERENCES);
      return;
    }

    // User is now signed in — try localStorage first (instant), then sync from DB.
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error);
    }

    getMe()
      .then((me) => (me ? getPreferences(me.id) : null))
      .then((data) => {
        if (!data) return;
        setPreferencesState(dbPreferencesToApp(data));
      })
      .catch(() => {
        // Leave localStorage / default state on DB failure — non-fatal.
      });
  }, [user]);

  // Persist preferences to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error);
    }
  }, [preferences]);

  // Apply theme to the document root.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);

  const setPreferences = (partial: Partial<Preferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...partial }));
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
