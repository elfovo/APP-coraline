'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'recova-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  // Charger la langue depuis localStorage au montage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (stored && (stored === 'fr' || stored === 'en')) {
        setLanguage(stored);
      } else {
        // Détecter la langue du navigateur
        const browserLang = navigator.language.startsWith('en') ? 'en' : 'fr';
        setLanguage(browserLang);
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, browserLang);
      }
    }
  }, []);

  // Mettre à jour localStorage quand la langue change
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      // Mettre à jour l'attribut lang du HTML
      document.documentElement.lang = lang;
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[language][key] || translations.fr[key];
    
    // Interpolation de variables (ex: {id} -> valeur)
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }
    
    return text;
  };

  // Mettre à jour l'attribut lang du HTML quand la langue change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

