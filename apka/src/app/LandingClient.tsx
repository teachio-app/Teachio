'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/* ── Nav ─────────────────────────────────────────────────────────────────────── */

function Nav() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const [userEmail,   setUserEmail]   = useState<string | null>(null)
  const [avatarDD,    setAvatarDD]    = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  const isAuthed = mounted && userEmail !== null
  const initials = userEmail ? userEmail[0].toUpperCase() : ''

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement bar */}
      {!isAuthed && (
        <div className="announcement-bar">
          🎓 Teachio je zdarma pro studenty středních škol —{' '}
          <Link href="/signup" className="font-bold underline underline-offset-2">Začni teď →</Link>
        </div>
      )}
    <nav
      className="transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.95)' : 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: '#f4f4f8' }}>Teachio</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthed ? (
            <>
              <Link href="/student" className="text-sm font-medium transition-colors hover:text-white" style={{ color:'#a1a1b8' }}>🏠 Domů</Link>
              <Link href="/student/vypisky" className="text-sm font-medium transition-colors hover:text-white" style={{ color:'#a1a1b8' }}>Výpisky</Link>
              <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-white" style={{ color:'#a1a1b8' }}>Ceny</Link>
            </>
          ) : (
            <>
              {[
                { href: '#features', label: 'Funkce' },
                { href: '#how', label: 'Jak to funguje' },
                { href: '/pricing', label: 'Ceny' },
              ].map(l => (
                <a key={l.href} href={l.href}
                  className="text-sm font-medium transition-colors hover:text-white"
                  style={{ color: '#a1a1b8' }}>
                  {l.label}
                </a>
              ))}
            </>
          )}
        </div>

        {/* CTA / auth row */}
        <div className="flex items-center gap-3">
          {isAuthed ? (
            <div className="relative">
              <button onClick={()=>setAvatarDD(v=>!v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.25)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  {initials}
                </div>
                <span className="hidden sm:block text-xs font-semibold" style={{ color:'#a78bfa' }}>Můj účet</span>
                <span className="text-[10px]" style={{ color:'#475569' }}>▾</span>
              </button>
              {avatarDD && (
                <>
                  <div className="fixed inset-0 z-40" onClick={()=>setAvatarDD(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden min-w-[180px]"
                    style={{ background:'rgba(10,10,20,0.98)', border:'1px solid rgba(124,58,237,0.25)', boxShadow:'0 16px 40px rgba(0,0,0,0.6)' }}>
                    <p className="px-4 py-2.5 text-xs truncate" style={{ color:'#475569', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{userEmail}</p>
                    <Link href="/student" onClick={()=>setAvatarDD(false)}
                      className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5" style={{ color:'#e2e8f0' }}>
                      🏠 Dashboard
                    </Link>
                    <Link href="/student/vypisky" onClick={()=>setAvatarDD(false)}
                      className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5" style={{ color:'#e2e8f0' }}>
                      📚 Výpisky
                    </Link>
                    <Link href="/pricing" onClick={()=>setAvatarDD(false)}
                      className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5" style={{ color:'#e2e8f0' }}>
                      ⚡ Upgrade
                    </Link>
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={async()=>{const sb=createClient();await sb.auth.signOut();setUserEmail(null);setAvatarDD(false)}}
                        className="block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5" style={{ color:'#64748b' }}>
                        Odhlásit se
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"
                className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ color: '#a1a1b8' }}>
                Přihlásit se
              </Link>
              <Link href="/signup"
                className="text-sm font-bold px-5 py-2.5 rounded-full text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.40)' }}>
                Začít zdarma →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-36 pb-20 text-center overflow-hidden">

      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute" style={{ width:'900px', height:'700px', top:'-200px', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.22) 0%,transparent 65%)', filter:'blur(80px)' }} />
        <div className="absolute" style={{ width:'600px', height:'600px', top:'30%', left:'-200px', background:'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 65%)', filter:'blur(70px)' }} />
        <div className="absolute" style={{ width:'500px', height:'500px', top:'10%', right:'-150px', background:'radial-gradient(ellipse,rgba(168,85,247,0.10) 0%,transparent 65%)', filter:'blur(60px)' }} />
        <div className="absolute" style={{ width:'700px', height:'500px', bottom:'-100px', right:'5%', background:'radial-gradient(ellipse,rgba(251,191,36,0.04) 0%,transparent 65%)', filter:'blur(90px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
          ✨ AI Studijní Asistent
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
          style={{ fontFamily: 'var(--font-bricolage, Inter), sans-serif', letterSpacing: '-0.03em' }}>
          <span style={{ color: '#f4f4f8' }}>Méně učení.</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Lepší výsledky.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#a1a1b8' }}>
          Zadej téma nebo nahraj zápisky — Teachio za vteřiny vygeneruje kvízy, podcast, flashkarty i studijní plán.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-base transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 8px 40px rgba(124,58,237,0.50)', minWidth: '220px', justifyContent: 'center' }}>
            Začít zdarma →
          </Link>
          <a href="#how"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#a1a1b8' }}>
            Jak to funguje? ↓
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mb-16">
          <div className="flex -space-x-2">
            {['#7c3aed','#a855f7','#6366f1','#ec4899','#0ea5e9'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: c, borderColor: '#0a0a0f' }}>
                {['J','M','T','A','K'][i]}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: '#62627a' }}>
            Přidej se k <span style={{ color: '#a78bfa', fontWeight: 700 }}>12 000+</span> studentů
          </p>
        </div>

        {/* Product mockup */}
        <div className="relative mx-auto max-w-2xl">
          {/* Glow behind card */}
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.30) 0%,transparent 70%)', filter: 'blur(40px)', transform: 'scale(1.15)' }} />

          {/* Browser frame */}
          <div className="relative rounded-3xl overflow-hidden text-left"
            style={{ background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.15)' }}>

            {/* Browser bar */}
            <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.55)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.55)' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(34,197,94,0.55)' }} />
              </div>
              <div className="flex-1 mx-4 px-3 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#62627a' }}>
                teachio.app/student
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* AI input bar */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 0 1px rgba(124,58,237,0.08)' }}>
                <div className="flex gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.20)', color: '#a78bfa' }}>✨ Zadat téma</span>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: '#62627a' }}>📄 Nahrát PDF</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: '#62627a' }}>Fotosyntéza a přeměna světla…</span>
                  <div className="px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                    ⚡ Vygenerovat
                  </div>
                </div>
              </div>

              {/* Feature chips row */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '🎧', label: 'Podcast', color: 'rgba(219,39,119,0.15)', border: 'rgba(219,39,119,0.30)', text: '#f472b6' },
                  { icon: '🧩', label: 'Kvíz', color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.30)', text: '#a78bfa' },
                  { icon: '📕', label: 'Flashkarty', color: 'rgba(5,150,105,0.12)', border: 'rgba(5,150,105,0.25)', text: '#34d399' },
                  { icon: '🗓️', label: 'Studijní plán', color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
                ].map(c => (
                  <span key={c.label} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: c.color, border: `1px solid ${c.border}`, color: c.text }}>
                    {c.icon} {c.label}
                  </span>
                ))}
              </div>

              {/* Mini calendar strip */}
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>📅 Studijní plán — Fotosyntéza</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>3/8 splněno ✓</span>
                </div>
                <div className="flex gap-1.5">
                  {['Po','Út','St','Čt','Pá','So','Ne'].map((d, i) => (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs" style={{ color: i === 3 ? '#a78bfa' : '#62627a' }}>{d}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={i === 3
                          ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }
                          : i < 3
                          ? { background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.40)', color: '#34d399' }
                          : { background: 'rgba(255,255,255,0.04)', color: '#62627a' }
                        }>{13 + i}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating feature chips */}
          <div className="hidden md:block">
            <div className="chip-float-1 absolute -left-28 top-8 px-3.5 py-2.5 rounded-2xl text-xs font-bold"
              style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.35)', color: '#2dd4bf', backdropFilter: 'blur(10px)', transform: 'rotate(-3deg)' }}>
              🎧 Výukový podcast
            </div>
            <div className="chip-float-2 absolute -right-28 top-12 px-3.5 py-2.5 rounded-2xl text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a78bfa', backdropFilter: 'blur(10px)', transform: 'rotate(2deg)' }}>
              🧩 Interaktivní kvíz
            </div>
            <div className="chip-float-3 absolute -left-24 bottom-16 px-3.5 py-2.5 rounded-2xl text-xs font-bold"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fbbf24', backdropFilter: 'blur(10px)', transform: 'rotate(-2deg)' }}>
              🗓️ Studijní plán
            </div>
            <div className="chip-float-4 absolute -right-24 bottom-12 px-3.5 py-2.5 rounded-2xl text-xs font-bold"
              style={{ background: 'rgba(236,72,153,0.13)', border: '1px solid rgba(236,72,153,0.30)', color: '#f472b6', backdropFilter: 'blur(10px)', transform: 'rotate(4deg)' }}>
              📕 Výpisky za 30s
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Social proof strip ─────────────────────────────────────────────────────── */

function SocialProofStrip() {
  const schools = ['ČVUT', 'MUNI', 'UK Praha', 'UP Olomouc', 'VUT Brno', 'UJEP', 'MU Brno']
  return (
    <section className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#62627a' }}>
          Používají studenti z předních českých škol a univerzit
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {schools.map(s => (
            <span key={s} className="text-sm font-bold transition-all hover:opacity-100"
              style={{ color: '#62627a', opacity: 0.5, letterSpacing: '0.05em' }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works ───────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    { num: '01', icon: '📝', title: 'Zadej téma', desc: 'Napiš název tématu nebo nahraj zápisky, PDF, nebo screenshot.' },
    { num: '02', icon: '🤖', title: 'Teachio generuje', desc: 'AI za 30 vteřin připraví výpisky, podcast, kvíz, flashkarty a studijní plán.' },
    { num: '03', icon: '🎓', title: 'Uč se chytře', desc: 'Procvičuj interaktivně, sleduj pokrok a přijď na zkoušku připravený.' },
  ]

  const features = [
    { icon: '🎧', title: 'Podcast', desc: 'Uč se cestou do školy — jako radio, ale o tvém tématu', accent: '#14b8a6' },
    { icon: '🧩', title: 'Kvíz', desc: '5 otázek s okamžitým vysvětlením — testuj pochopení', accent: '#6366f1' },
    { icon: '📕', title: 'Flashkarty', desc: 'Otočné kartičky se spaced repetition — ideální pro pojmy', accent: '#10b981' },
    { icon: '🎮', title: 'Minigra', desc: 'Spáruj pojmy nebo seřaď — učení hrou, ne drillem', accent: '#f59e0b' },
    { icon: '🗓️', title: 'Studijní plán', desc: 'Nastav termín zkoušky — Teachio rozloží látku do denních dávek', accent: '#a855f7' },
  ]

  return (
    <section id="how" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>Jak to funguje</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: '#f4f4f8', fontFamily: 'var(--font-bricolage, Inter), sans-serif' }}>
            Tři kroky k lepším výsledkům
          </h2>
          <p className="text-lg" style={{ color: '#a1a1b8' }}>Žádný komplikovaný setup. Začneš učit za 30 vteřin.</p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.4),transparent)' }} />

          {steps.map((s, i) => (
            <div key={s.num} className="relative flex flex-col items-center text-center gap-4 p-8 rounded-3xl transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.20)' }}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: '#7c3aed' }}>Krok {s.num}</p>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#f4f4f8' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#a1a1b8' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="group p-6 rounded-3xl transition-all hover:scale-[1.02] cursor-default"
              style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30` }}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: '#f4f4f8' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#a1a1b8' }}>{f.desc}</p>
              <div className="mt-4 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-500"
                style={{ background: `linear-gradient(90deg,${f.accent},transparent)` }} />
            </div>
          ))}
          {/* CTA card */}
          <div className="p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 sm:col-span-2 lg:col-span-1"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.10))', border: '1px solid rgba(124,58,237,0.25)' }}>
            <span className="text-4xl">🚀</span>
            <div>
              <p className="text-base font-bold mb-1" style={{ color: '#f4f4f8' }}>Vše v jednom</p>
              <p className="text-sm" style={{ color: '#a1a1b8' }}>Bezplatně pro studenty</p>
            </div>
            <Link href="/signup"
              className="mt-2 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              Začít zdarma
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Comparison table ───────────────────────────────────────────────────────── */

function ComparisonTable() {
  const rows = [
    { label: 'Navrženo pro studenty', teachio: true, chatgpt: false, others: false },
    { label: 'Podcast k tématu', teachio: true, chatgpt: false, others: false },
    { label: 'Interaktivní kvíz', teachio: true, chatgpt: false, others: false },
    { label: 'Studijní plán s kalendářem', teachio: true, chatgpt: false, others: false },
    { label: 'Flashkarty se SR algoritmem', teachio: true, chatgpt: false, others: false },
    { label: 'Funguje okamžitě (30 vteřin)', teachio: true, chatgpt: false, others: false },
    { label: 'Zdarma bez kreditní karty', teachio: true, chatgpt: false, others: false },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>Srovnání</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#f4f4f8', fontFamily: 'var(--font-bricolage, Inter), sans-serif' }}>
            Nejsme další AI aplikace.
          </h2>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(17,17,24,0.9)' }}>
          {/* Header */}
          <div className="grid grid-cols-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#62627a' }}>Funkce</div>
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.20)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.30)' }}>
                ✨ Teachio
              </div>
            </div>
            <div className="text-center text-xs font-semibold" style={{ color: '#62627a' }}>ChatGPT</div>
            <div className="text-center text-xs font-semibold" style={{ color: '#62627a' }}>Ostatní AI</div>
          </div>

          {rows.map((r, i) => (
            <div key={r.label} className="grid grid-cols-4 px-6 py-4 items-center transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span className="text-sm" style={{ color: '#a1a1b8' }}>{r.label}</span>
              <div className="text-center text-lg">{r.teachio ? '✅' : '❌'}</div>
              <div className="text-center text-lg" style={{ opacity: 0.5 }}>{r.chatgpt ? '✅' : '❌'}</div>
              <div className="text-center text-lg" style={{ opacity: 0.5 }}>{r.others ? '✅' : '❌'}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ───────────────────────────────────────────────────────────── */

function Testimonials() {
  const items = [
    { stars: 5, text: 'Nevěřila jsem, že AI může udělat podcast přesně o tom, co studuju. Na Teachiu mi to trvalo 25 vteřin a bylo to lepší než moje zápisky.', name: 'Tereza M.', school: 'MUNI Brno, 2. ročník' },
    { stars: 5, text: 'Zkoušel jsem všechno — ChatGPT, Notion AI... Tohle je první věc, která mi fakt pomohla se naučit na státnice. Ten studijní plán mě doslova zachránil.', name: 'Jakub H.', school: 'VUT Brno, 2. ročník Ing.' },
    { stars: 5, text: 'Flashkarty se samy generují z látky a pak tě zkoušejí. Na maturity jsem se naučila 200 pojmů za týden, dřív by to trvalo měsíc.', name: 'Anička K.', school: 'Gymnázium Praha, maturantka' },
    { stars: 5, text: 'Paráda! Kvíz mi ukázal přesně kde mám díry ve znalosti, ne jen co umím. Přesně to jsem potřeboval před přijímačkami.', name: 'Marek S.', school: 'SŠ Olomouc, 4. ročník' },
  ]

  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>Recenze</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#f4f4f8', fontFamily: 'var(--font-bricolage, Inter), sans-serif' }}>
            Co říkají studenti
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-4 p-6 rounded-3xl transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="flex gap-1">
                {Array.from({ length: item.stars }).map((_, j) => (
                  <span key={j} style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1" style={{ color: '#a1a1b8' }}>"{item.text}"</p>
              <div>
                <p className="text-sm font-bold" style={{ color: '#f4f4f8' }}>{item.name}</p>
                <p className="text-xs" style={{ color: '#62627a' }}>{item.school}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats card */}
        <div className="mt-6 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-around gap-8 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(124,58,237,0.20)' }}>
          {[
            { num: '12 000+', label: 'aktivních studentů' },
            { num: '4.9★', label: 'průměrné hodnocení' },
            { num: '50+', label: 'škol a univerzit' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black" style={{ color: '#f4f4f8', fontFamily: 'var(--font-bricolage, Inter), sans-serif' }}>{s.num}</p>
              <p className="text-sm mt-1" style={{ color: '#a1a1b8' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ──────────────────────────────────────────────────────────────── */

function FinalCTA() {
  const [activeIdx, setActiveIdx] = useState(0)
  const lines = [
    'Nestíháš se naučit na zkoušku?',
    'Chybí ti čas na opakování?',
    'Potřebuješ lepší známky?',
  ]

  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % lines.length), 3000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute" style={{ width:'800px', height:'600px', bottom:'-200px', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.20) 0%,transparent 65%)', filter:'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7c3aed' }}>Začni dnes</p>
        <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-4" style={{ color: '#f4f4f8', fontFamily: 'var(--font-bricolage, Inter), sans-serif' }}>
          Ušetři čas už dnes
        </h2>

        {/* Rotating subline */}
        <div className="h-8 overflow-hidden relative mb-10">
          {lines.map((line, i) => (
            <p key={i} className="absolute inset-0 flex items-center justify-center text-lg font-medium transition-all duration-500"
              style={{
                color: '#a1a1b8',
                opacity: activeIdx === i ? 1 : 0,
                transform: activeIdx === i ? 'translateY(0)' : 'translateY(-20px)',
              }}>
              {line}
            </p>
          ))}
        </div>

        <Link href="/signup"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-white font-bold text-xl transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 12px 50px rgba(124,58,237,0.55)' }}>
          Jdu do toho! →
        </Link>

        <p className="mt-6 text-sm" style={{ color: '#62627a' }}>
          Žádná kreditní karta · Okamžitý přístup · Zdarma
        </p>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                <span className="text-white font-black text-sm">T</span>
              </div>
              <span className="font-bold text-lg" style={{ color: '#f4f4f8' }}>Teachio</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#62627a' }}>
              AI studijní asistent pro česky mluvící studenty.
              <br />Podcast, kvízy, flashkarty a studijní plán za 30 vteřin.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#62627a' }}>Produkt</p>
            <div className="space-y-3">
              {[{ href: '#features', label: 'Funkce' }, { href: '/pricing', label: 'Ceny' }, { href: '/student', label: 'Spustit app' }].map(l => (
                <a key={l.href} href={l.href} className="block text-sm transition-colors hover:opacity-80" style={{ color: '#a1a1b8' }}>{l.label}</a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#62627a' }}>Právní</p>
            <div className="space-y-3">
              {[
                { href: '/privacy', label: 'Ochrana dat' },
                { href: '/terms', label: 'Podmínky' },
              ].map(l => (
                <a key={l.href} href={l.href} className="block text-sm transition-colors hover:opacity-80" style={{ color: '#a1a1b8' }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-sm" style={{ color: '#62627a' }}>© {new Date().getFullYear()} Teachio · Všechna práva vyhrazena</p>
          <div className="flex items-center gap-4">
            {['Instagram', 'TikTok', 'LinkedIn'].map(s => (
              <a key={s} href="#" className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#62627a' }}>{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── Root ────────────────────────────────────────────────────────────────────── */

export default function LandingClient() {
  return (
    <div style={{ background: '#0a0a0f', color: '#f4f4f8', minHeight: '100vh' }}>
      <Nav />
      <Hero />
      <SocialProofStrip />
      <HowItWorks />
      <ComparisonTable />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  )
}
