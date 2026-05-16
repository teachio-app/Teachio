import { createClient } from '@/lib/supabase/server'
import { CreditSystem } from '@/components/ui/CreditSystem'
import { DevCheatButton } from '@/components/ui/DevCheatButton'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { ClientProviders } from '@/components/ui/ClientProviders'
import { RoleSwitcher } from '@/components/ui/RoleSwitcher'
import { LocalizedNav, LocalizedMobileNav } from '@/components/ui/LocalizedNav'
import { StreakBadge } from '@/components/ui/StreakBadge'
import { getProfile } from '@/lib/actions/credits'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  const profile = await getProfile()
  const role    = profile?.role as 'teacher' | 'student' | null | undefined ?? null

  const roleBadge = role === 'student'
    ? { emoji: '🎓', label: 'Student',  color: '#7c3aed' }
    : { emoji: '👨‍🏫', label: 'Učitel',   color: '#4f46e5' }

  return (
    <ClientProviders>
    <div className="min-h-screen relative" style={{ background: '#ede9fe' }}>

      {/* ── Static background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ contain: 'layout style paint' }} aria-hidden="true">
        <div className="absolute inset-0" style={{ background:'linear-gradient(145deg,#ede9fe 0%,#ddd6fe 20%,#e0e7ff 45%,#f3e8ff 70%,#fce7f3 100%)' }} />
        <div className="absolute rounded-full" style={{ width:'1200px',height:'1200px',top:'-420px',left:'-420px', background:'radial-gradient(circle,rgba(99,102,241,0.40) 0%,rgba(99,102,241,0.12) 45%,transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width:'1000px',height:'1000px',top:'-220px',right:'-320px', background:'radial-gradient(circle,rgba(168,85,247,0.36) 0%,rgba(168,85,247,0.10) 45%,transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width:'900px',height:'900px',bottom:'-220px',left:'28%', background:'radial-gradient(circle,rgba(236,72,153,0.28) 0%,rgba(236,72,153,0.08) 45%,transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.2' fill='rgba(109%2C40%2C217%2C0.10)'/%3E%3C/svg%3E\")", backgroundSize:'24px 24px' }} />
      </div>

      {/* ── Header ── */}
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Logo + role badge */}
          <Link href="/"
            className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
              style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <span className="text-white font-black text-sm">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg tracking-tight text-slate-900 leading-none">Teachio</span>
              {role && (
                <span className="block text-xs font-semibold" style={{ color: roleBadge.color }}>
                  {roleBadge.emoji} {roleBadge.label}
                </span>
              )}
            </div>
          </Link>

          {/* Localized nav — client component so it reacts to language changes */}
          <LocalizedNav role={role} />

          {/* User controls */}
          <div className="flex items-center gap-2 shrink-0">
            <StreakBadge />
            <LanguageSelector />
            <RoleSwitcher currentRole={role} />
            <CreditSystem
              initialCredits={profile?.credits ?? 0}
              initialIsPro={profile?.is_pro ?? false}
            />
            <Link href="/profil"
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md hover:shadow-lg transition-shadow"
              style={{ background:'linear-gradient(135deg,#6366f1,#a855f7)' }}
              title={user?.email ?? ''}>
              {initials}
            </Link>
            <span className="hidden xl:block text-slate-500 text-sm truncate max-w-[160px]">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav — localized client component */}
      <LocalizedMobileNav role={role} />

      {/* ── Page content ── */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 pb-24 sm:pb-10">
        {children}
      </main>

      {/* Dev cheat — only rendered in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <DevCheatButton />
        </div>
      )}
    </div>
    </ClientProviders>
  )
}
