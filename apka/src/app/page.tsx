import { redirect } from 'next/navigation'
import Link from 'next/link'

// Authenticated users are redirected to their role-based dashboard.
// Unauthenticated users see a public landing page (full version built in Phase 15 Step 3).
export default async function LandingPage() {
  // Server-side auth check — non-fatal (catches missing env vars in dev)
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'teacher') redirect('/teacher')
      if (profile?.role === 'student') redirect('/student')
      redirect('/onboarding')
    }
  } catch {}

  // ── Public landing (placeholder for Step 3) ────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(145deg,#ede9fe 0%,#ddd6fe 20%,#e0e7ff 45%,#f3e8ff 70%,#fce7f3 100%)' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full" style={{ width: '900px', height: '900px', top: '-350px', left: '-350px', background: 'radial-gradient(circle,rgba(99,102,241,0.35) 0%,transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ width: '800px', height: '800px', bottom: '-250px', right: '-200px', background: 'radial-gradient(circle,rgba(168,85,247,0.30) 0%,transparent 65%)' }} />
      </div>

      <div className="relative text-center space-y-8 max-w-2xl">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mx-auto"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 20px 60px rgba(109,40,217,0.35)' }}>
          <span className="text-white font-black text-3xl">T</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900">
            Teachio
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto">
            Studijní asistent nové generace.
            <br />
            Výpisky, hry, plány hodin — vše za vteřiny.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login"
            className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 12px 40px rgba(79,46,220,0.35)' }}>
            Začít zdarma →
          </Link>
          <Link href="/pricing"
            className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/80"
            style={{ background: 'rgba(255,255,255,0.65)', color: '#4f46e5', border: '1.5px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(10px)' }}>
            ⭐ Ceník
          </Link>
        </div>

        {/* Quick feature hints */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {['🗂️ 3D Kartičky', '🗺️ Mind Mapy', '🏛 E-U-R Plány', '🎮 Interaktivní hry', '📝 Hodnotitel esejí'].map(f => (
            <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#4f46e5' }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
