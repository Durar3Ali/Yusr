import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@/types';

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
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error);
    }
    return defaultPreferences;
  });

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
