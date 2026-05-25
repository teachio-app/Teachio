import { createClient } from '@/lib/supabase/server'
import { CreditSystem } from '@/components/ui/CreditSystem'
import { DevCheatButton } from '@/components/ui/DevCheatButton'
import { ClientProviders } from '@/components/ui/ClientProviders'
import { LocalizedNav, LocalizedMobileNav } from '@/components/ui/LocalizedNav'
import { StreakBadge } from '@/components/ui/StreakBadge'
import { ProfileDropdown } from '@/components/ui/ProfileDropdown'
import { getProfile } from '@/lib/actions/credits'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??'

  const profile = await getProfile()
  const role    = profile?.role as 'teacher' | 'student' | null | undefined ?? null

  // Both roles now use the dark theme — teachers get blue accents, students get purple
  const isDark    = role === 'student' || role === 'teacher'
  const isTeacher = role === 'teacher'

  const roleBadge = role === 'student'
    ? { emoji: '🎓', label: 'Student', color: '#a78bfa' }
    : { emoji: '👨‍🏫', label: 'Učitel',  color: '#60a5fa' }

  return (
    <ClientProviders>
    <div className="min-h-screen relative" style={{ background: isDark ? '#06060f' : '#ede9fe' }}>

      {/* ── Full-viewport background ── */}
      {isDark ? (
        /* Dark theme: student=purple glow, teacher=blue glow */
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{ transform: 'translateZ(0)', background: isTeacher ? 'linear-gradient(180deg,#06080f 0%,#070a14 50%,#060810 100%)' : 'linear-gradient(180deg,#06060f 0%,#080b18 50%,#06060f 100%)' }}
        >
          {isTeacher ? (
            /* Teacher: deep blue accent orbs */
            <>
              <div className="absolute rounded-full" style={{ width:'800px', height:'600px', top:'-200px', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(37,99,235,0.16) 0%,transparent 65%)', filter:'blur(80px)' }} />
              <div className="absolute rounded-full" style={{ width:'500px', height:'500px', top:'20%', left:'-150px', background:'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 65%)', filter:'blur(70px)' }} />
              <div className="absolute rounded-full" style={{ width:'400px', height:'400px', top:'10%', right:'-100px', background:'radial-gradient(ellipse,rgba(14,165,233,0.07) 0%,transparent 65%)', filter:'blur(60px)' }} />
            </>
          ) : (
            /* Student: purple/pink accent orbs */
            <>
              <div className="absolute rounded-full" style={{ width:'800px', height:'600px', top:'-200px', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,transparent 65%)', filter:'blur(80px)' }} />
              <div className="absolute rounded-full" style={{ width:'500px', height:'500px', top:'20%', left:'-150px', background:'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 65%)', filter:'blur(70px)' }} />
              <div className="absolute rounded-full" style={{ width:'400px', height:'400px', top:'10%', right:'-100px', background:'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 65%)', filter:'blur(60px)' }} />
              <div className="absolute rounded-full" style={{ width:'600px', height:'500px', bottom:'0', right:'5%', background:'radial-gradient(ellipse,rgba(236,72,153,0.06) 0%,transparent 65%)', filter:'blur(90px)' }} />
            </>
          )}
        </div>
      ) : (
        /* Teacher/other: soft violet gradient */
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{
            transform: 'translateZ(0)',
            background: [
              'radial-gradient(ellipse 80% 60% at -5% -5%, rgba(99,102,241,0.32) 0%, transparent 60%)',
              'radial-gradient(ellipse 70% 55% at 105% -5%, rgba(168,85,247,0.28) 0%, transparent 60%)',
              'radial-gradient(ellipse 65% 50% at 50% 108%, rgba(236,72,153,0.20) 0%, transparent 60%)',
              'linear-gradient(145deg,#ede9fe 0%,#ddd6fe 20%,#e0e7ff 45%,#f3e8ff 70%,#fce7f3 100%)',
            ].join(','),
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.2' fill='rgba(109%2C40%2C217%2C0.08)'/%3E%3C/svg%3E\")",
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      )}

      {/* ── Header ── */}
      <header className={isDark ? (isTeacher ? 'dark-header-blue sticky top-0 z-20' : 'dark-header sticky top-0 z-20') : 'glass-header sticky top-0 z-20'}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Logo + role badge */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
              style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <span className="text-white font-black text-sm">T</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg tracking-tight leading-none"
                style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                Teachio
              </span>
              {role && (
                <span className="block text-xs font-semibold" style={{ color: roleBadge.color }}>
                  {roleBadge.emoji} {roleBadge.label}
                </span>
              )}
            </div>
          </Link>

          {/* Nav */}
          <LocalizedNav role={role} />

          {/* User controls — clean: Streak · Credits · Avatar+Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <StreakBadge />
            <CreditSystem
              initialCredits={profile?.credits ?? 0}
              initialIsPro={profile?.is_pro ?? false}
            />
            <ProfileDropdown
              initials={initials}
              email={user?.email}
              role={role}
              isDark={isDark}
            />
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <LocalizedMobileNav role={role} />

      {/* ── Page content ── */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 pb-24 sm:pb-10">
        {children}
      </main>

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <DevCheatButton />
        </div>
      )}
    </div>
    </ClientProviders>
  )
}
