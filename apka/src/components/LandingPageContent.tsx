'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const FEATURES = [
  { icon: '🎧', title: 'Výukový podcast', desc: 'Učitelka a student diskutují tvé téma jako virální radio show.', color: '#ec4899', word: 'Podcast' },
  { icon: '🧩', title: 'Interaktivní kvíz', desc: '5 otázek s okamžitým vysvětlením — testuje porozumění, ne jen memorii.', color: '#a78bfa', word: 'Kvíz' },
  { icon: '🃏', title: 'Flashkarty', desc: 'Otočitelné kartičky s pojmy a definicemi ve stylu Quizlet.', color: '#f97316', word: 'Flashkarty' },
  { icon: '🕹️', title: 'Minigra', desc: 'Spáruj pojmy nebo je seřaď — učení hrou, ne drillem.', color: '#34d399', word: 'Minihru' },
  { icon: '🗓️', title: 'Studijní plán', desc: 'Nastav termín zkoušky, Teachio rozloží látku do denních dávek.', color: '#60a5fa', word: 'Studijní plán' },
]

const COMPARISON = [
  'Navrženo přímo pro studenty',
  'Vytvoří obsah během vteřin',
  'Podcast pro učení po cestě',
  'Interaktivní kvíz s vysvětlením',
  'Studijní plán před zkouškou',
  'Funguje bez instalace, hned',
]

const TESTIMONIALS = [
  { quote: 'Díky Teachiu jsem zvládl maturitu z biologie za týden. Podcast k fotosyntéze jsem poslouchal i v tramvaji.', name: 'Marek K.', school: 'SŠ Praha', initials: 'MK', color: '#7c3aed' },
  { quote: 'Wow efekt hned na začátku — během vteřin jsem měla kvízy a kartičky hotové. Intuitivní a překvapivě chytrá.', name: 'Jana V.', school: 'ČVUT', initials: 'JV', color: '#ec4899' },
  { quote: 'Nejlepší věc je studijní plán. Nastavila jsem zkouškový termín a Teachio mi rozložilo učení den po dni.', name: 'Tereza B.', school: 'MUNI Brno', initials: 'TB', color: '#0d9488' },
  { quote: 'Flashkarty z každé přednášky za 30 vteřin. Ušetřím hodiny každý týden. Tohle bych chtěl mít dřív.', name: 'Tomáš R.', school: 'VUT Brno', initials: 'TR', color: '#2563eb' },
]

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }

// Dark theme tokens
const BG    = '#06060f'
const CARD  = 'rgba(255,255,255,0.03)'
const CARD2 = 'rgba(255,255,255,0.05)'
const BORDER = 'rgba(255,255,255,0.08)'
const BORDER2 = 'rgba(255,255,255,0.12)'
const TEXT  = '#f1f5f9'
const MUTED = '#94a3b8'
const DIM   = '#475569'

export default function LandingPageContent() {
  const [active, setActive] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FEATURES.length), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const feat = FEATURES[active]

  return (
    <div style={{ fontFamily: 'var(--font-inter), -apple-system, sans-serif', background: BG, color: TEXT, overflowX: 'hidden', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html,body { background: ${BG} !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wordSwap { 0%{opacity:0;transform:translateY(6px)} 12%{opacity:1;transform:translateY(0)} 88%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }
        @keyframes fl1 { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-7px)} }
        @keyframes fl2 { 0%,100%{transform:rotate(2deg) translateY(0)} 50%{transform:rotate(2deg) translateY(-6px)} }
        @keyframes fl3 { 0%,100%{transform:rotate(4deg) translateY(0)} 50%{transform:rotate(4deg) translateY(-8px)} }
        .au{animation:fadeUp 0.55s ease-out both}
        .au1{animation-delay:0s}.au2{animation-delay:0.1s}.au3{animation-delay:0.2s}.au4{animation-delay:0.3s}
        .fl1{animation:fl1 4s ease-in-out infinite}
        .fl2{animation:fl2 5s ease-in-out infinite}
        .fl3{animation:fl3 4.5s ease-in-out infinite}
        .word-anim{animation:wordSwap 3s ease-in-out both}
        .cta{transition:all 0.18s ease}
        .cta:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .nav-link{color:${MUTED};font-size:14px;font-weight:500;text-decoration:none;transition:color 0.15s}
        .nav-link:hover{color:#a78bfa}
        .scroll-hide::-webkit-scrollbar{display:none}
        .scroll-hide{-ms-overflow-style:none;scrollbar-width:none}
        .feat-card{transition:all 0.35s ease;cursor:pointer}
        @media(max-width:768px){
          .hide-mobile{display:none !important}
          .mobile-stack{grid-template-columns:1fr !important}
        }
      ` }} />

      {/* ── AMBIENT GLOW ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} aria-hidden>
        <div style={{ position:'absolute', width:900, height:700, top:-200, left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.20) 0%,transparent 65%)', filter:'blur(80px)' }}/>
        <div style={{ position:'absolute', width:600, height:600, top:'30%', left:-200, background:'radial-gradient(ellipse,rgba(59,130,246,0.10) 0%,transparent 65%)', filter:'blur(70px)' }}/>
        <div style={{ position:'absolute', width:500, height:500, top:'10%', right:-150, background:'radial-gradient(ellipse,rgba(236,72,153,0.08) 0%,transparent 65%)', filter:'blur(60px)' }}/>
        <div style={{ position:'absolute', width:700, height:500, bottom:-100, right:'5%', background:'radial-gradient(ellipse,rgba(251,191,36,0.05) 0%,transparent 65%)', filter:'blur(90px)' }}/>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background: scrolled?'rgba(6,6,15,0.92)':'transparent', backdropFilter: scrolled?'blur(16px)':'none', borderBottom: scrolled?`1px solid ${BORDER}`:'1px solid transparent', transition:'all 0.25s ease' }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, position:'relative', zIndex:1 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
              <span style={{ color:'#fff', fontWeight:900, fontSize:15 }}>T</span>
            </div>
            <span style={{ fontWeight:700, fontSize:18, color: TEXT, letterSpacing:'-0.02em' }}>Teachio</span>
          </Link>

          <div className="hide-mobile" style={{ display:'flex', gap:32 }}>
            {[
              { label: 'Funkce',        href: '/funkce' },
              { label: 'O nás',         href: '/o-nas' },
              { label: 'Blog',          href: '/blog' },
              { label: 'Studijní plán', href: '/studijni-plan' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="nav-link">{label}</Link>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <Link href="/login" style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${BORDER2}`, color: MUTED, fontSize:14, fontWeight:600, textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = CARD2; e.currentTarget.style.color = TEXT }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED }}>
              Přihlásit se
            </Link>
            <Link href="/signup" className="cta" style={{ padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
              Přejít do aplikace
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'91vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 24px 60px', position:'relative', zIndex:1 }}>
        <div className="au au1" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:100, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', display:'inline-block', boxShadow:'0 0 6px #a78bfa' }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'#a78bfa', letterSpacing:'0.06em', textTransform:'uppercase' }}>AI studijní asistent</span>
        </div>

        <h1 className="au au2" style={{ ...serif, fontSize:'clamp(48px,8vw,72px)', fontWeight:900, lineHeight:1.08, letterSpacing:'-0.02em', marginBottom:22, maxWidth:700 }}>
          <span style={{ background:'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 40%,#a78bfa 70%,#818cf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Méně učení.
          </span>
          <br/>
          <span style={{ background:'linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Lepší výsledky.
          </span>
        </h1>

        <p className="au au3" style={{ fontSize:18, color: MUTED, maxWidth:510, lineHeight:1.68, marginBottom:38 }}>
          Zadej téma nebo nahraj zápisky — Teachio za vteřiny vygeneruje kvízy, podcast, flashkarty i studijní plán.
        </p>

        <div className="au au4" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <Link href="/signup" className="cta" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 40px', borderRadius:100, background:'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color:'#fff', fontWeight:700, fontSize:16, textDecoration:'none', boxShadow:'0 8px 32px rgba(124,58,237,0.45)' }}>
            Začít zdarma!
          </Link>
          <p style={{ fontSize:13, color: DIM }}>Žádná kreditní karta · Okamžitý přístup</p>
        </div>
      </section>

      {/* ── PRODUCT MOCKUP ── */}
      <section style={{ padding:'0 24px 100px', maxWidth:920, margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', background: CARD, border:`1px solid ${BORDER}`, position:'relative', zIndex:1 }}>
          <div style={{ background:'rgba(255,255,255,0.03)', borderBottom:`1px solid ${BORDER}`, padding:'12px 18px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', gap:6 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'rgba(239,68,68,0.5)' }}/>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'rgba(245,158,11,0.5)' }}/>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'rgba(34,197,94,0.5)' }}/>
            </div>
            <div style={{ flex:1, background:'rgba(255,255,255,0.05)', borderRadius:7, padding:'4px 14px', fontSize:12, color: DIM, marginLeft:8 }}>
              app.teachio.cz/student
            </div>
          </div>
          <div style={{ padding:'28px 28px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background: CARD2, borderRadius:14, padding:18, border:`1px solid rgba(124,58,237,0.30)` }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#a78bfa', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>📝 Zadat téma</div>
                <div style={{ background:'rgba(124,58,237,0.08)', borderRadius:8, padding:'10px 14px', fontSize:13, color: MUTED, border:'1.5px solid rgba(124,58,237,0.20)' }}>Fotosyntéza a přeměna světla…</div>
                <div style={{ marginTop:12, height:34, background:'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>⚡ Vygenerovat</div>
              </div>
              <div style={{ background: CARD2, borderRadius:14, padding:16, border:`1px solid ${BORDER}` }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#34d399', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>🗓️ Studijní plán</div>
                <div style={{ display:'flex', gap:4 }}>
                  {['Po','Út','St','Čt','Pá'].map((d,i) => (
                    <div key={d} style={{ flex:1, textAlign:'center' }}>
                      <div style={{ fontSize:10, color: DIM, marginBottom:4 }}>{d}</div>
                      <div style={{ aspectRatio:'1', borderRadius:7, background: i===1?'linear-gradient(135deg,#6366f1,#7c3aed)':i===3?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color: i===1?'#fff':i===3?'#fca5a5': DIM }}>
                        {['1h','2h','—','1h','—'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background: CARD2, borderRadius:14, padding:18, border:'1px solid rgba(236,72,153,0.20)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#ec4899', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>🎧 Podcast</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#ec4899,#f97316)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13 }}>▶</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: TEXT }}>Fotosyntéza ep.1</div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, marginTop:7 }}>
                      <div style={{ width:'38%', height:'100%', background:'linear-gradient(90deg,#ec4899,#f97316)', borderRadius:2 }}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: CARD2, borderRadius:14, padding:18, border:'1px solid rgba(124,58,237,0.20)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#a78bfa', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>🧩 Kvíz</div>
                <div style={{ fontSize:13, color: MUTED, marginBottom:10 }}>Co je primární produkt fotosyntézy?</div>
                {['Glukóza ✓','CO₂','Voda'].map((o,i) => (
                  <div key={o} style={{ padding:'7px 12px', borderRadius:7, marginBottom:6, background: i===0?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${i===0?'rgba(34,197,94,0.30)':BORDER}`, fontSize:12, color: i===0?'#4ade80': MUTED, fontWeight: i===0?700:400 }}>{o}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating chips */}
        <div className="fl1" style={{ position:'absolute', top:-16, left:-24, background:'rgba(20,10,40,0.95)', borderRadius:12, padding:'10px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', border:`1px solid rgba(124,58,237,0.30)`, zIndex:2 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#a78bfa' }}>🃏 Flashkarta</div>
          <div style={{ fontSize:12, color: MUTED, marginTop:2 }}>Chlorofyl absorbuje světlo</div>
        </div>
        <div className="fl2" style={{ position:'absolute', top:32, right:-28, background:'rgba(20,10,40,0.95)', borderRadius:12, padding:'10px 16px', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', border:'1px solid rgba(236,72,153,0.25)', zIndex:2 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#ec4899' }}>🕹️ Minihra</div>
          <div style={{ fontSize:12, color: MUTED, marginTop:2 }}>Spáruj pojmy!</div>
        </div>
        <div className="fl3" style={{ position:'absolute', bottom:24, right:-24, background:'rgba(20,10,40,0.95)', borderRadius:10, padding:'10px 16px', boxShadow:'0 6px 16px rgba(0,0,0,0.4)', border:'1px solid rgba(251,191,36,0.20)', zIndex:2 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#fbbf24' }}>📌 Dnes</div>
          <div style={{ fontSize:12, color: MUTED, marginTop:2 }}>Kap. 3 — 45 min</div>
        </div>
      </section>

      {/* ── UNIVERSITY STRIP ── */}
      <section style={{ background:'rgba(255,255,255,0.02)', borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, padding:'32px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:960, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:40, flexWrap:'wrap', marginBottom:14 }}>
            {['ČVUT','MUNI','UK Praha','UP Olomouc','VUT Brno'].map(u => (
              <span key={u} style={{ fontSize:15, fontWeight:700, color: DIM, letterSpacing:'0.04em' }}>{u}</span>
            ))}
          </div>
          <p style={{ fontSize:13, color: DIM }}>Používají studenti z předních českých škol a univerzit.</p>
        </div>
      </section>

      {/* ── CYCLING FEATURES ── */}
      <section style={{ padding:'100px 24px', textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:580, margin:'0 auto' }}>
          <h2 style={{ ...serif, fontSize:'clamp(30px,5vw,48px)', fontWeight:900, lineHeight:1.12, marginBottom:14, color: TEXT }}>
            Zadej téma a vytvoř si{' '}
            <span key={active} className="word-anim" style={{ color: feat.color, display:'inline-block' }}>{feat.word}</span>
          </h2>
          <p style={{ fontSize:16, color: DIM, marginBottom:52 }}>Vše z jednoho tématu nebo nahraných zápisků.</p>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FEATURES.map((f,i) => {
              const on = i === active
              const dist = Math.abs(i - active)
              return (
                <div key={f.title} className="feat-card" onClick={() => setActive(i)} style={{
                  background: on ? 'rgba(255,255,255,0.05)' : CARD,
                  border: `1.5px solid ${on ? f.color+'60' : BORDER}`,
                  borderRadius:14, padding:'16px 20px',
                  display:'flex', alignItems:'center', gap:14,
                  opacity: dist===0?1:dist===1?0.55:0.25,
                  transform: `scale(${on?1:0.97})`,
                  boxShadow: on ? `0 0 0 4px ${f.color}18, 0 8px 32px rgba(0,0,0,0.3)` : 'none',
                  textAlign:'left',
                }}>
                  <span style={{ fontSize:22, width:36, textAlign:'center', flexShrink:0 }}>{f.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color: on ? TEXT : MUTED }}>{f.title}</div>
                    {on && <div style={{ fontSize:13, color: MUTED, marginTop:4, lineHeight:1.55 }}>{f.desc}</div>}
                  </div>
                  {on && <div style={{ width:8, height:8, borderRadius:'50%', background: f.color, flexShrink:0, boxShadow:`0 0 8px ${f.color}` }}/>}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop:36 }}>
            <Link href="/signup" className="cta" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:100, background:'rgba(255,255,255,0.06)', border:`1px solid ${BORDER2}`, color: TEXT, fontWeight:700, fontSize:14, textDecoration:'none' }}>
              Jak to funguje? →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ ...serif, fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color: TEXT, marginBottom:12 }}>
            Nejsme další AI aplikace.
          </h2>
          <p style={{ fontSize:16, color: MUTED, maxWidth:460, margin:'0 auto 24px', lineHeight:1.65 }}>
            Teachio automatizuje vše, co jiné nástroje nechávají na tobě. Výsledek? Méně přípravy, více skutečného učení.
          </p>
          <Link href="/signup" className="cta" style={{ display:'inline-flex', padding:'13px 28px', borderRadius:100, background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 4px 16px rgba(124,58,237,0.35)', marginBottom:48 }}>
            Vyzkoušet zdarma!
          </Link>

          <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${BORDER}`, boxShadow:'0 8px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background: CARD2, borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ padding:'16px 20px', fontWeight:700, fontSize:13, color: MUTED, textAlign:'left' }}>Funkce</div>
              <div style={{ padding:'16px 20px', fontWeight:800, fontSize:13, color:'#a78bfa', background:'rgba(124,58,237,0.12)', textAlign:'center' }}>Teachio ✓</div>
              <div style={{ padding:'16px 20px', fontWeight:700, fontSize:13, color: DIM, textAlign:'center' }}>Běžné AI ✗</div>
            </div>
            {COMPARISON.map((row,i) => (
              <div key={row} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background: i%2===0? CARD : CARD2, borderBottom: i<COMPARISON.length-1?`1px solid ${BORDER}`:'none' }}>
                <div style={{ padding:'13px 20px', fontSize:14, color: MUTED, textAlign:'left' }}>{row}</div>
                <div style={{ padding:'13px 20px', textAlign:'center', background:'rgba(124,58,237,0.08)', fontSize:17, color:'#a78bfa', fontWeight:700 }}>✓</div>
                <div style={{ padding:'13px 20px', textAlign:'center', fontSize:17, color: DIM }}>✗</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:'100px 0', position:'relative', zIndex:1 }}>
        <h2 style={{ ...serif, fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color: TEXT, textAlign:'center', marginBottom:48 }}>
          Co říkají studenti
        </h2>
        <div className="scroll-hide" style={{ display:'flex', gap:20, overflowX:'auto', paddingLeft:40, paddingRight:40, paddingBottom:20 }}>
          {TESTIMONIALS.map((t,i) => (
            <div key={i} style={{ minWidth:320, maxWidth:340, background: CARD, borderRadius:20, padding:28, border:`1px solid ${BORDER}`, boxShadow:'0 8px 32px rgba(0,0,0,0.3)', flexShrink:0 }}>
              <div style={{ display:'flex', gap:2, marginBottom:16 }}>
                {[...Array(5)].map((_,s) => <span key={s} style={{ color:'#f59e0b', fontSize:15 }}>★</span>)}
              </div>
              <p style={{ fontSize:14, color: MUTED, lineHeight:1.68, marginBottom:20 }}>"{t.quote}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color: TEXT }}>{t.name}</div>
                  <div style={{ fontSize:12, color: DIM }}>{t.school}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── URGENCY CTA ── */}
      <section style={{ padding:'60px 24px 100px', textAlign:'center', position:'relative', zIndex:1 }}>
        <h2 style={{ ...serif, fontSize:'clamp(26px,4vw,42px)', fontWeight:900, color: TEXT, marginBottom:36 }}>
          Ušetři čas už dnes
        </h2>
        <div style={{ maxWidth:460, margin:'0 auto 36px', background:'rgba(124,58,237,0.08)', borderRadius:24, padding:'36px 44px', border:'1px solid rgba(124,58,237,0.20)' }}>
          <p style={{ ...serif, fontSize:22, color:'#c4b5fd', fontStyle:'italic', lineHeight:1.55, margin:0 }}>
            "Nestíháš se naučit<br/>na zkoušku?"
          </p>
        </div>
        <Link href="/signup" className="cta" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 44px', borderRadius:100, background:'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color:'#fff', fontWeight:700, fontSize:16, textDecoration:'none', boxShadow:'0 8px 32px rgba(124,58,237,0.45)' }}>
          Jdu do toho!
        </Link>
      </section>

      {/* ── WEB & MOBILE ── */}
      <section style={{ padding:'80px 24px', background:'rgba(255,255,255,0.02)', borderTop:`1px solid ${BORDER}`, position:'relative', zIndex:1 }}>
        <div className="mobile-stack" style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }}>
          <div>
            <h2 style={{ ...serif, fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color: TEXT, lineHeight:1.2, marginBottom:16 }}>
              Funguje všude —<br/>web i mobil
            </h2>
            <p style={{ fontSize:16, color: MUTED, lineHeight:1.68, marginBottom:32, maxWidth:400 }}>
              Kdekoliv chceš. Teachio funguje v prohlížeči na počítači i telefonu — bez instalace, hned.
            </p>
            <Link href="/signup" className="cta" style={{ display:'inline-flex', padding:'13px 28px', borderRadius:100, background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
              Přejít do aplikace
            </Link>
          </div>
          <div style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center', height:260 }}>
            <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', border:`1px dotted rgba(124,58,237,0.25)`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
            <div style={{ position:'absolute', width:210, height:210, borderRadius:'50%', border:`1px dotted rgba(124,58,237,0.15)`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
            <div style={{ width:280, height:175, background:'rgba(255,255,255,0.04)', borderRadius:'12px 12px 0 0', boxShadow:'0 20px 40px rgba(0,0,0,0.4)', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
              <div style={{ width:'90%', height:'87%', background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid rgba(124,58,237,0.20)` }}>
                <span style={{ fontSize:30 }}>🎓</span>
              </div>
            </div>
            <div style={{ width:72, height:124, background:'rgba(255,255,255,0.04)', borderRadius:13, boxShadow:'0 16px 32px rgba(0,0,0,0.4)', position:'absolute', bottom:-16, right:20, zIndex:2, border:`2px solid ${BORDER2}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'80%', height:'85%', background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2))', borderRadius:7 }}/>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding:'100px 24px', background:'linear-gradient(135deg,rgba(79,46,220,0.3),rgba(124,58,237,0.2) 50%,rgba(236,72,153,0.15))', borderTop:`1px solid ${BORDER}`, textAlign:'center', position:'relative', zIndex:1 }}>
        <h2 style={{ ...serif, fontSize:'clamp(26px,5vw,52px)', fontWeight:900, color: TEXT, marginBottom:40, lineHeight:1.13 }}>
          Připraven začít se učit chytřeji?
        </h2>
        <Link href="/signup" className="cta" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'17px 44px', borderRadius:100, background:'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color:'#fff', fontWeight:700, fontSize:16, textDecoration:'none', boxShadow:'0 8px 32px rgba(124,58,237,0.5)' }}>
          Vyzkoušet Teachio zdarma →
        </Link>
        <p style={{ marginTop:18, fontSize:13, color: DIM }}>
          Žádná kreditní karta. Okamžitý přístup.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'rgba(255,255,255,0.02)', padding:'52px 24px 32px', borderTop:`1px solid ${BORDER}`, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32, marginBottom:36 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontWeight:900, fontSize:14 }}>T</span>
                </div>
                <span style={{ fontWeight:700, fontSize:17, color: TEXT }}>Teachio</span>
              </div>
              <p style={{ fontSize:13, color:'#a78bfa', fontWeight:500, marginBottom:16 }}>Tvůj AI studijní asistent</p>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {['Obchodní podmínky','GDPR','Kontakt'].map(l => (
                  <a key={l} href="#" style={{ fontSize:13, color: DIM, textDecoration:'none' }}>{l}</a>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <a href="#" style={{ width:36, height:36, borderRadius:'50%', background: CARD2, border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none' }}>📸</a>
              <a href="#" style={{ width:36, height:36, borderRadius:'50%', background: CARD2, border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none' }}>🎵</a>
              <Link href="/signup" style={{ padding:'10px 22px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                Přejít do aplikace
              </Link>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:22, textAlign:'center', fontSize:13, color: DIM }}>
            © Teachio 2026
          </div>
        </div>
      </footer>
    </div>
  )
}
