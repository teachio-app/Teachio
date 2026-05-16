'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { LANGUAGES, type LangCode } from '@/lib/i18n/translations'
import { useState, useRef, useEffect } from 'react'

export function LanguageSelector() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function pick(code: LangCode) {
    setLang(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-violet-200 bg-white/70 hover:bg-violet-50 transition-colors"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-violet-100 bg-white shadow-lg overflow-hidden z-50"
        >
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => pick(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-left transition-colors
                ${l.code === lang
                  ? 'bg-violet-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-violet-50'
                }`}
            >
              <span className="text-base">{l.flag}</span>
              {l.name}
              {l.code === lang && (
                <svg className="ml-auto w-3.5 h-3.5 text-indigo-600" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.5 4.5L6.5 11.5 2.5 7.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
