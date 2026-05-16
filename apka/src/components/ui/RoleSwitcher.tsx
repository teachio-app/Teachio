'use client'

import { useState, useRef, useEffect } from 'react'
import { saveRole, type UserRole } from '@/lib/actions/onboarding'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUniversityMode } from '@/lib/UniversityModeContext'

// Localised label for the university mode toggle
const UNI_LABELS: Record<string, string> = {
  cz: '🎓 Vysokoškolský mód',
  en: '🎓 University Mode',
  de: '🎓 Hochschulmodus',
  fr: '🎓 Mode Universitaire',
}

const ROLE_LABELS: Record<string, { myRole: string; teacher: string; student: string; switchTo: (r: 'teacher' | 'student') => string }> = {
  cz: { myRole: 'Moje role', teacher: '👨‍🏫 Učitel',  student: '🎓 Student',    switchTo: r => r === 'teacher' ? 'Přepnout na Učitele' : 'Přepnout na Studenta' },
  en: { myRole: 'My role',   teacher: '👨‍🏫 Teacher', student: '🎓 Student',    switchTo: r => r === 'teacher' ? 'Switch to Teacher' : 'Switch to Student' },
  de: { myRole: 'Meine Rolle', teacher: '👨‍🏫 Lehrer/in', student: '🎓 Student/in', switchTo: r => r === 'teacher' ? 'Zu Lehrer/in wechseln' : 'Zu Student/in wechseln' },
  fr: { myRole: 'Mon rôle',  teacher: '👨‍🏫 Enseignant(e)', student: '🎓 Étudiant(e)', switchTo: r => r === 'teacher' ? 'Passer Enseignant' : 'Passer Étudiant' },
}

export function RoleSwitcher({ currentRole }: { currentRole: UserRole | null }) {
  const [open, setOpen]     = useState(false)
  const ref                  = useRef<HTMLDivElement>(null)
  const { lang }             = useLanguage()
  const uniMode              = useUniversityMode()

  const targetRole: UserRole = currentRole === 'teacher' ? 'student' : 'teacher'
  const labels               = ROLE_LABELS[lang] ?? ROLE_LABELS.cz
  const targetEmoji          = targetRole === 'teacher' ? '👨‍🏫' : '🎓'

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Gear button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Nastavení účtu"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 border border-violet-200 bg-white/70 hover:bg-violet-50 hover:text-indigo-600 transition-colors"
        title="Nastavení"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-violet-100 bg-white shadow-xl overflow-hidden z-50">

          {/* Current role */}
          <div className="px-3 py-2.5 border-b border-violet-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{labels.myRole}</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {currentRole === 'teacher' ? labels.teacher : labels.student}
            </p>
          </div>

          {/* Switch role */}
          <form action={saveRole.bind(null, targetRole)} className="p-1.5 border-b border-violet-50">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-violet-50 hover:text-indigo-700 transition-colors text-left"
            >
              <span className="text-base">{targetEmoji}</span>
              {labels.switchTo(targetRole)}
            </button>
          </form>

          {/* University mode toggle — only shown for students */}
          {currentRole === 'student' && (
            <div className="p-1.5">
              <button
                type="button"
                onClick={uniMode.toggle}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-violet-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">🎓</span>
                  <span className="text-sm font-semibold text-slate-700 leading-tight truncate">
                    {UNI_LABELS[lang] ?? UNI_LABELS.cz}
                  </span>
                </div>
                {/* iOS-style pill toggle */}
                <div
                  className="relative ml-3 w-11 h-6 rounded-full shrink-0 transition-colors duration-200"
                  style={{ background: uniMode.enabled ? '#6366f1' : '#e2e8f0' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: uniMode.enabled ? '1.375rem' : '0.25rem' }}
                  />
                </div>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
