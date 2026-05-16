'use client'

// Client component so it can subscribe to LanguageContext and re-render
// when the user switches language — server-rendered nav strings would never update.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useUniversityMode } from '@/lib/UniversityModeContext'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

type Role = 'teacher' | 'student' | null

interface Props { role: Role }

export function LocalizedNav({ role }: Props) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const { enabled: uniMode } = useUniversityMode()

  const links = role === 'student'
    ? [
        { href: '/',               label: t.nav.home     },
        { href: '/student',        label: t.nav.notes    },
        { href: '/student/grader', label: t.nav.grader   },
        ...(uniMode ? [{ href: '/student/research', label: t.nav.research }] : []),
        { href: '/profil',         label: `📂 ${t.nav.history}` },
        { href: '/pricing',        label: t.nav.pricing  },
      ]
    : [
        { href: '/',        label: t.nav.home               },
        { href: '/teacher', label: `✨ ${t.nav.generator}`  },
        { href: '/profil',  label: `📂 ${t.nav.history}`    },
        { href: '/pricing', label: t.nav.pricing             },
      ]

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1 rounded-2xl p-1 bg-violet-50 border border-violet-100">
        {links.map(({ href, label }) => {
          const active = pathname === href || (href !== '/profil' && pathname.startsWith(href + '/'))
          return (
            <Link key={href} href={href}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                color:      active ? '#4f46e5' : '#475569',
                background: active ? 'white'   : 'transparent',
                boxShadow:  active ? '0 1px 4px rgba(99,102,241,0.15)' : 'none',
              }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout button — also localized */}
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm"
          className="text-sm font-medium border-violet-200 text-slate-700 hover:bg-violet-50">
          {t.nav.logout}
        </Button>
      </form>
    </>
  )
}

// ── Mobile bottom nav (also localized) ────────────────────────────────────────

export function LocalizedMobileNav({ role }: Props) {
  const { t } = useLanguage()
  const { enabled: uniMode } = useUniversityMode()

  const links = role === 'student'
    ? [
        { href: '/student',        emoji: '✨', label: t.nav.notes.replace(/^[^ ]+ /, '') },
        { href: '/student/grader', emoji: '📝', label: t.nav.grader.replace(/^[^ ]+ /, '') },
        ...(uniMode ? [{ href: '/student/research', emoji: '🔬', label: 'Research' }] : []),
        { href: '/profil',         emoji: '📂', label: t.nav.history },
      ]
    : [
        { href: '/teacher', emoji: '✨', label: t.nav.generator },
        { href: '/profil',  emoji: '📂', label: t.nav.history },
      ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex glass-header border-t border-violet-100">
      {links.map(({ href, emoji, label }) => (
        <Link key={href} href={href}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-slate-600 hover:text-indigo-700">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs font-medium truncate max-w-[56px] text-center">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
