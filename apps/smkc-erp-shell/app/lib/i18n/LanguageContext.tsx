'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { TRANSLATIONS, type Lang, type Translations } from '../i18n/translations'

// ── Context shape ─────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  T: Translations
  /** Translate a menu-item label for a given dept + item key.
   *  Falls back to the original English label if no translation found. */
  tMenu: (deptKey: string, itemKey: string, fallback: string) => string
  /** Translate a KPI stat label. Falls back to the English label. */
  tStat: (englishLabel: string) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
  T: TRANSLATIONS.en,
  tMenu: (_d, _i, fb) => fb,
  tStat: (l) => l,
})

// ── Provider ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'smkc-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (saved === 'en' || saved === 'mr') {
      setLangState(saved)
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem(STORAGE_KEY, newLang)
  }, [])

  const T = TRANSLATIONS[lang]

  const tMenu = useCallback(
    (deptKey: string, itemKey: string, fallback: string): string =>
      T.menuItems[deptKey]?.[itemKey] ?? fallback,
    [T],
  )

  const tStat = useCallback(
    (englishLabel: string): string =>
      T.statLabels[englishLabel] ?? englishLabel,
    [T],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, T, tMenu, tStat }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
