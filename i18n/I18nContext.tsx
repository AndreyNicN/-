import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { translations, Language } from './locales';

type I18nContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
    const storedLang = localStorage.getItem('app-language') as Language;
    if (storedLang && translations[storedLang]) {
        return storedLang;
    }
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'ru' || browserLang === 'uk') {
        return browserLang;
    }
    return 'ru'; // Default to Russian as per request
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  
  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};