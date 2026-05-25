import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
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

  const FEATURES = [
    { icon: '🎧', label: 'Virtuální podcast', desc: '2 hlasy, ON AIR' },
    { icon: '🧩', label: 'Interaktivní kvíz', desc: '5 otázek s vysvětlením' },
    { icon: '🃏', label: '3D Flashkarty', desc: 'Quizlet killer' },
    { icon: '🕹️', label: 'Minihry', desc: 'Matching + Sorting' },
    { icon: '🗺️', label: 'Mind Mapa', desc: 'Mermaid.js' },
    { icon: '📋', label: 'E-U-R Plány', desc: 'Pro učitele' },
  ]

  return (
    <>
    {/* Force dark body — overrides the global bg-background from globals.css */}
    {/* eslint-disable-next-line react/no-danger */}
    <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#06060f!important;color:#f1f5f9}' }} />
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#06060f' }}>

      {/* ── Full-viewport ambient glow ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true" style={{ transform: 'translateZ(0)' }}>
        <div style={{ position:'absolute', width:'900px', height:'700px', top:'-200px', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.20) 0%,transparent 65%)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', width:'600px', height:'600px', top:'30%', left:'-200px', background:'radial-gradient(ellipse,rgba(59,130,246,0.10) 0%,transparent 65%)', filter:'blur(70px)' }} />
        <div style={{ position:'absolute', width:'500px', height:'500px', top:'10%', right:'-150px', background:'radial-gradient(ellipse,rgba(236,72,153,0.08) 0%,transparent 65%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', width:'700px', height:'500px', bottom:'-100px', right:'5%', background:'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 65%)', filter:'blur(90px)' }} />
      </div>

      {/* ── Minimal nav ── */}
      <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#f1f5f9' }}>Teachio</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: '#94a3b8' }}>
            Přihlásit se
          </Link>
          <Link href="/signup"
            className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            Začít zdarma
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">

        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
          Studijní asistent nové generace
        </div>

        {/* Main headline */}
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6">
          <span style={{
            background: 'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 40%,#a78bfa 70%,#818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Hlava se láme jako chleba
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
          Nahraj zápisky nebo zadej téma. Teachio vytvoří podcast, kvíz, flashkarty a hry — za cca 30 vteřin.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
            Začít zdarma — bez karty
            <span>→</span>
          </Link>
          <Link href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#94a3b8' }}>
            ⭐ Ceník
          </Link>
        </div>

        {/* ── Dashboard visual teaser ── */}
        <div className="relative mx-auto max-w-2xl">
          {/* Glow behind the card */}
          <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.25) 0%,transparent 70%)', filter: 'blur(40px)', transform: 'scale(1.1)' }} />

          {/* Main preview card */}
          <div className="relative rounded-3xl overflow-hidden text-left"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.5)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(34,197,94,0.5)' }} />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>
                apka-chi.vercel.app/student
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* AI Input bar */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.30)', boxShadow: '0 0 0 1px rgba(124,58,237,0.08)' }}>
                <div className="flex gap-2 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ background: 'rgba(124,58,237,0.20)', color: '#a78bfa' }}>✨ Zadat téma</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{ color: '#475569' }}>📄 Nahrát PDF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#475569' }}>Fotosyntéza a přeměna světla…</span>
                  <div className="px-4 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
                    ⚡ Vygenerovat
                  </div>
                </div>
              </div>

              {/* Mini calendar widget */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>📅 Zkouškový kalendář</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>30% Mastery</span>
                </div>
                <div className="flex gap-1.5">
                  {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d, i) => (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs" style={{ color: i === 2 ? '#a78bfa' : '#334155' }}>{d}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={i === 2
                          ? { background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff' }
                          : i === 4
                          ? { background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)', color: '#fca5a5' }
                          : { background: 'rgba(255,255,255,0.04)', color: '#334155' }
                        }>{13 + i}</div>
                      {i === 4 && <span className="text-xs" style={{ color: '#f87171' }}>test</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature chips row */}
              <div className="flex flex-wrap gap-2">
                {['🎧 Podcast', '🧩 Kvíz', '🃏 Flashkarty', '🕹️ Minihra'].map(chip => (
                  <span key={chip} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature grid ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <p className="text-center text-xs font-bold uppercase tracking-widest mb-8" style={{ color: '#334155' }}>
          Vše v jednom — pro studenty i učitele
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className="rounded-2xl p-4 space-y-2 hover:scale-[1.02] transition-transform"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{f.label}</p>
              <p className="text-xs" style={{ color: '#475569' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="relative z-10 text-center py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <p className="text-xs" style={{ color: '#334155' }}>© 2025 Teachio · Všechna práva vyhrazena</p>
      </div>
    </div>
    </>
  )
}
