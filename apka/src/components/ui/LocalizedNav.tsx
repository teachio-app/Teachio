'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useEffect, useState } from 'react'

type Role = 'teacher' | 'student' | null
interface Props { role: Role }

export function LocalizedNav({ role }: Props) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [hasPlan, setHasPlan] = useState(false)

  useEffect(() => {
    if (role === 'student') {
      try {
        const raw = localStorage.getItem('teachio:plans:v1')
        if (raw) {
          const plans = JSON.parse(raw)
          setHasPlan(Array.isArray(plans) && plans.length > 0)
        }
      } catch {}
    }
  }, [role])

  // Only the two most essential links — everything else lives in ProfileDropdown
  const studentLinks = [
    { href: '/',       label: t.nav.home  },
    { href: '/student', label: t.nav.notes },
    ...(hasPlan ? [{ href: '/studijni-plan', label: '📅 Můj plán' }] : []),
  ]

  const links = role === 'student'
    ? studentLinks
    : [
        { href: '/',        label: t.nav.home                },
        { href: '/teacher', label: `✨ ${t.nav.generator}` },
      ]

  const isDark     = role === 'student' || role === 'teacher'
  const isTeacher  = role === 'teacher'
  const activeColor  = isTeacher ? '#93c5fd' : '#a78bfa'
  const activeBg     = isTeacher ? 'rgba(37,99,235,0.18)' : 'rgba(124,58,237,0.18)'
  const activeShadow = isTeacher ? '0 1px 4px rgba(37,99,235,0.20)' : '0 1px 4px rgba(124,58,237,0.20)'

  return (
    <nav
      className="hidden sm:flex items-center gap-1 rounded-2xl p-1"
      style={isDark
        ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
        : { background: 'rgb(245,243,255)', border: '1px solid rgb(237,233,254)' }
      }
    >
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link key={href} href={href}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={isDark
              ? {
                  color:      active ? activeColor  : '#64748b',
                  background: active ? activeBg     : 'transparent',
                  boxShadow:  active ? activeShadow : 'none',
                }
              : {
                  color:      active ? '#4f46e5' : '#475569',
                  background: active ? 'white'   : 'transparent',
                  boxShadow:  active ? '0 1px 4px rgba(99,102,241,0.15)' : 'none',
                }
            }>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────

export function LocalizedMobileNav({ role }: Props) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const [hasPlan, setHasPlan] = useState(false)

  useEffect(() => {
    if (role === 'student') {
      try {
        const raw = localStorage.getItem('teachio:plans:v1')
        if (raw) {
          const plans = JSON.parse(raw)
          setHasPlan(Array.isArray(plans) && plans.length > 0)
        }
      } catch {}
    }
  }, [role])

  const studentLinks = [
    { href: '/student',        emoji: '✨', label: 'Výpisky'  },
    { href: '/student/grader', emoji: '📝', label: 'Grader'   },
    ...(hasPlan
      ? [{ href: '/studijni-plan', emoji: '📅', label: 'Plán' }]
      : [{ href: '/student/files', emoji: '📂', label: 'Soubory' }]
    ),
    { href: '/profil',         emoji: '🗂️', label: 'Historie' },
  ]

  const links = role === 'student'
    ? studentLinks
    : [
        { href: '/teacher', emoji: '✨', label: t.nav.generator },
        { href: '/profil',  emoji: '📂', label: t.nav.history   },
      ]

  const isDark = role === 'student' || role === 'teacher'

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t"
      style={isDark
        ? { background: 'rgba(6,6,15,0.92)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }
        : { background: 'rgba(255,255,255,0.93)', borderColor: 'rgba(139,92,246,0.14)' }
      }>
      {links.map(({ href, emoji, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
            style={{ color: active ? '#a78bfa' : '#475569' }}>
            <span className="text-lg">{emoji}</span>
            <span className="text-xs font-medium truncate max-w-[56px] text-center">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
