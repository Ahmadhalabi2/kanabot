import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { en, ar, type Translations } from '../i18n';

export type Lang = 'en' | 'ar';

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  isRtl: boolean;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('kanbot_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const isRtl = lang === 'ar';
  const t = lang === 'ar' ? ar : en;

  // Sync document direction + lang attribute whenever language changes
  useEffect(() => {
    document.documentElement.dir  = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('kanbot_lang', lang);
  }, [lang, isRtl]);

  const toggleLang = () => setLang((l) => (l === 'en' ? 'ar' : 'en'));

  return (
    <LanguageContext.Provider value={{ lang, t, isRtl, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
