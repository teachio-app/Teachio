'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Client component — reads pathname to derive active mode.
 * Rendered inside the Server Component layout.
 */
export function NavModeSwitch() {
  const pathname = usePathname()

  const isTeacher = pathname.startsWith('/teacher') ||
    pathname.startsWith('/generator') ||
    pathname.startsWith('/profil')

  const isStudent = pathname.startsWith('/student')

  return (
    <div
      className="flex rounded-2xl p-1"
      style={{
        background: 'rgba(109,40,217,0.07)',
        border: '1px solid rgba(255,255,255,0.65)',
      }}
    >
      <Link
        href="/teacher"
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all select-none ${
          isTeacher
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>👨‍🏫</span>
        <span className="hidden sm:inline">Jsem</span>
        <span>Učitel</span>
      </Link>

      <Link
        href="/student"
        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all select-none ${
          isStudent
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>🎓</span>
        <span className="hidden sm:inline">Jsem</span>
        <span>Student</span>
      </Link>
    </div>
  )
}
