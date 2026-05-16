'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, type ReactNode,
} from 'react'
import { type LangCode, translations } from './translations'

// ── Types ─────────────────────────────────────────────────────────────────────

// Union of all language objects — all share the same structure, values differ.
export type AnyTranslation = (typeof translations)[LangCode]

interface LanguageContextValue {
  lang:    LangCode
  setLang: (l: LangCode) => void
  t:       AnyTranslation
}

// ── Context ───────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | null>(null)
const STORAGE_KEY = 'teachio_lang'

function isValidLang(v: unknown): v is LangCode {
  return typeof v === 'string' && v in translations
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with 'cz' on SSR; on client the useEffect below immediately corrects it.
  // We do NOT read localStorage in useState() initializer to avoid SSR/hydration mismatch.
  const [lang, setLangState] = useState<LangCode>('cz')

  // One-time hydration from localStorage — runs synchronously after first paint.
  // Using a layout effect here would cause SSR warnings; useEffect is correct.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isValidLang(stored)) setLangState(stored)
    } catch {}
  }, [])

  // Stable setter — useCallback ensures the function reference never changes,
  // so context consumers don't re-render just because the provider re-rendered.
  const setLang = useCallback((l: LangCode) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  }, [])

  // Memoize the context value so consumers only re-render when lang actually changes.
  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: translations[lang] as AnyTranslation }),
    [lang, setLang],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside <LanguageProvider>')
  return ctx
}
