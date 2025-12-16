
import React, { createContext, useContext, useEffect, useState } from 'react';
import { BackgroundTheme } from '../types';

type ThemeMode = 'light' | 'dark';
type Language = 'vi' | 'en';

interface ThemeContextType {
  theme: ThemeMode;
  language: Language;
  showNSFW: boolean;
  backgroundTheme: BackgroundTheme;
  bgClass: string; // The calculated tailwind class string
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  toggleNSFW: () => void;
  setBackgroundTheme: (bg: BackgroundTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define Tailwind classes for each theme using Rich Gradients (3-stops)
// Based on the "Discord Nitro Themes" style requested
const BG_CLASSES: Record<BackgroundTheme, string> = {
  // Default: Beige/Grayish (Classic) -> Dark Slate
  default:  "bg-gradient-to-br from-slate-100 via-stone-100 to-zinc-200 dark:from-[#1e1f22] dark:via-[#2b2d31] dark:to-[#313338]", 
  
  // Ocean: The "Selected" Blue/Purple in the image
  // Light: Soft Periwinkle -> Blue. Dark: Deep Galaxy Blue.
  ocean:    "bg-gradient-to-br from-indigo-200 via-blue-100 to-cyan-100 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81]", 
  
  // Forest: Mint/Green in the image
  // Light: Mint -> Lime. Dark: Deep Jungle.
  forest:   "bg-gradient-to-br from-emerald-100 via-teal-100 to-green-200 dark:from-[#022c22] dark:via-[#064e3b] dark:to-[#115e59]", 
  
  // Sunset: Peach/Orange in the image
  // Light: Peach -> Warm Yellow. Dark: Deep Magma/Red.
  sunset:   "bg-gradient-to-br from-orange-100 via-amber-100 to-rose-200 dark:from-[#451a03] dark:via-[#7c2d12] dark:to-[#991b1b]", 
  
  // Lavender: Pink/Rose in the image
  // Light: Soft Pink -> Lavender. Dark: Deep Cosmic/Purple.
  lavender: "bg-gradient-to-br from-fuchsia-100 via-pink-100 to-purple-200 dark:from-[#2e1065] dark:via-[#4c1d95] dark:to-[#701a75]", 
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeMode) || 'dark';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'vi';
  });

  const [showNSFW, setShowNSFW] = useState<boolean>(() => {
    const saved = localStorage.getItem('app-show-nsfw');
    return saved === 'true'; // Default false
  });

  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(() => {
    const saved = localStorage.getItem('app-bg-theme');
    return (saved as BackgroundTheme) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-show-nsfw', String(showNSFW));
  }, [showNSFW]);

  useEffect(() => {
    localStorage.setItem('app-bg-theme', backgroundTheme);
  }, [backgroundTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleNSFW = () => {
    setShowNSFW(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      language, 
      showNSFW, 
      backgroundTheme, 
      bgClass: BG_CLASSES[backgroundTheme],
      toggleTheme, 
      setLanguage, 
      toggleNSFW, 
      setBackgroundTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
