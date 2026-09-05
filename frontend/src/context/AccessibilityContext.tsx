import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type FontSize = 'normal' | 'large' | 'x-large';

interface AccessibilitySettings {
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setFontSize: (size: FontSize) => void;
  setReducedMotion: (on: boolean) => void;
  setHighContrast: (on: boolean) => void;
}

const STORAGE_KEY = 'event-hub:accessibility';

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  reducedMotion: false,
  highContrast: false,
};

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    // ignore malformed storage
  }
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return { ...defaultSettings, reducedMotion: prefersReducedMotion };
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    root.setAttribute('data-a11y-font', settings.fontSize);
    root.setAttribute('data-a11y-motion', settings.reducedMotion ? 'reduce' : 'normal');
    root.setAttribute('data-a11y-contrast', settings.highContrast ? 'high' : 'normal');
  }, [settings]);

  const value: AccessibilityContextValue = {
    ...settings,
    setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
    setReducedMotion: (reducedMotion) => setSettings((s) => ({ ...s, reducedMotion })),
    setHighContrast: (highContrast) => setSettings((s) => ({ ...s, highContrast })),
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
}
