'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUniversityMode } from '@/lib/UniversityModeContext'
import { logout } from '@/lib/actions/auth'
import { saveRole, type UserRole } from '@/lib/actions/onboarding'
import { LANGUAGES } from '@/lib/i18n/translations'

type Role = 'teacher' | 'student' | null

interface Props {
  initials: string
  email:    string | null | undefined
  role:     Role
  isDark:   boolean
}

const ROLE_LABELS: Record<string, { teacher: string; student: string }> = {
  cz: { teacher: '👨‍🏫 Učitel',   student: '🎓 Student'     },
  en: { teacher: '👨‍🏫 Teacher',  student: '🎓 Student'     },
  de: { teacher: '👨‍🏫 Lehrer/in', student: '🎓 Student/in' },
  fr: { teacher: '👨‍🏫 Enseignant', student: '🎓 Étudiant'  },
}

export function ProfileDropdown({ initials, email, role, isDark }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { lang, setLang, t } = useLanguage()
  const uniMode = useUniversityMode()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open])

  const targetRole: UserRole = role === 'teacher' ? 'student' : 'teacher'
  const labels = ROLE_LABELS[lang] ?? ROLE_LABELS.cz
  const currentLabel = role === 'teacher' ? labels.teacher : labels.student
  const switchLabel  = role === 'teacher'
    ? (lang === 'cz' ? 'Přepnout na Studenta' : lang === 'de' ? 'Zu Student/in wechseln' : lang === 'fr' ? 'Passer Étudiant' : 'Switch to Student')
    : (lang === 'cz' ? 'Přepnout na Učitele'  : lang === 'de' ? 'Zu Lehrer/in wechseln'  : lang === 'fr' ? 'Passer Enseignant' : 'Switch to Teacher')

  // Divider helper
  const HR = () => (
    <div className="mx-3 my-1" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
  )

  // Item helper
  function Item({ href, emoji, label, onClick }: { href?: string; emoji: string; label: string; onClick?: () => void }) {
    const base = "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
    const style = { color: '#94a3b8' }
    const hoverCls = "hover:bg-white/5 hover:text-slate-200"

    if (href) {
      return (
        <Link href={href} onClick={() => setOpen(false)}
          className={`${base} ${hoverCls}`} style={style}>
          <span className="text-base w-5 text-center">{emoji}</span>{label}
        </Link>
      )
    }
    return (
      <button onClick={onClick} className={`${base} ${hoverCls}`} style={style}>
        <span className="text-base w-5 text-center">{emoji}</span>{label}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Profil menu"
        aria-expanded={open}
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white transition-all hover:scale-105 hover:shadow-lg"
        style={{
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          boxShadow: open ? '0 0 0 2px rgba(124,58,237,0.5)' : '0 4px 12px rgba(99,102,241,0.3)',
        }}
      >
        {initials}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'rgba(10,10,20,0.95)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold truncate" style={{ color: '#f1f5f9' }}>{email ?? '—'}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{currentLabel}</p>
          </div>

          <div className="p-1.5 space-y-0.5">

            {/* Primary nav items */}
            {role === 'student' && <Item href="/student"        emoji="✨" label={t.nav.notes.replace(/^[^ ]+ /, '')} />}
            {role === 'teacher' && <Item href="/teacher"        emoji="✨" label={t.nav.generator} />}
            {role === 'student' && <Item href="/student/files"  emoji="📂" label={t.nav.files.replace(/^[^ ]+ /, '')} />}
            <Item href="/profil" emoji="🗂️" label={t.nav.history} />
            {role === 'student' && <Item href="/student/grader" emoji="📝" label={t.nav.grader.replace(/^[^ ]+ /, '')} />}
            {role === 'student' && uniMode.enabled && (
              <Item href="/student/research" emoji="🔬" label="Research Lab" />
            )}
            <Item href="/pricing" emoji="⭐" label={t.nav.pricing.replace(/^[^ ]+ /, '')} />

            <HR />

            {/* Role switch */}
            {role !== null && (
              <form action={saveRole.bind(null, targetRole)} className="p-0">
                <button type="submit"
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-white/5"
                  style={{ color: '#94a3b8' }}>
                  <span className="text-base w-5 text-center">{role === 'teacher' ? '🎓' : '👨‍🏫'}</span>
                  {switchLabel}
                </button>
              </form>
            )}

            {/* University mode (student only) */}
            {role === 'student' && (
              <button
                onClick={uniMode.toggle}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: '#94a3b8' }}
              >
                <span className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">🎓</span>
                  Vysokoškolský mód
                </span>
                <div
                  className="relative w-10 h-5 rounded-full shrink-0 transition-colors"
                  style={{ background: uniMode.enabled ? '#6366f1' : 'rgba(255,255,255,0.12)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: uniMode.enabled ? '1.25rem' : '0.125rem' }}
                  />
                </div>
              </button>
            )}

            <HR />

            {/* Language selector — inline flags */}
            <div className="px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#334155' }}>Jazyk</p>
              <div className="flex gap-1.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    title={l.name}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
                    style={{
                      background: lang === l.code ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                      border: lang === l.code ? '1px solid rgba(124,58,237,0.40)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {l.flag}
                  </button>
                ))}
              </div>
            </div>

            <HR />

            {/* Logout */}
            <form action={logout} className="p-0">
              <button type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-red-500/10 hover:text-red-400"
                style={{ color: '#64748b' }}>
                <span className="text-base w-5 text-center">↗</span>
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
