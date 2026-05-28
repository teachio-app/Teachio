'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BG    = '#06060f'
const CARD2 = 'rgba(255,255,255,0.05)'
const BORDER  = 'rgba(255,255,255,0.08)'
const BORDER2 = 'rgba(255,255,255,0.12)'
const TEXT  = '#f1f5f9'
const MUTED = '#94a3b8'
const DIM   = '#475569'

const NAV_LINKS = [
  { href: '/funkce',        label: 'Funkce' },
  { href: '/o-nas',         label: 'O nás' },
  { href: '/blog',          label: 'Blog' },
  { href: '/studijni-plan', label: 'Studijní plán' },
]

interface Props {
  children: React.ReactNode
  compact?: boolean
}

export function PublicShell({ children, compact }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [hasPlan, setHasPlan] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('teachio:plans:v1')
      if (raw) {
        const plans = JSON.parse(raw)
        setHasPlan(Array.isArray(plans) && plans.length > 0)
      }
    } catch {}
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-inter), -apple-system, sans-serif', background: BG, color: TEXT, overflowX: 'hidden', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html,body { background: ${BG} !important; }
        @keyframes pub-fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .pub-au{animation:pub-fadeUp 0.55s ease-out both}
        .pub-au1{animation-delay:0.00s}
        .pub-au2{animation-delay:0.08s}
        .pub-au3{animation-delay:0.16s}
        .pub-au4{animation-delay:0.24s}
        .pub-au5{animation-delay:0.32s}
        .pub-cta{transition:all 0.18s ease}
        .pub-cta:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .pub-nav-link{color:${MUTED};font-size:14px;font-weight:500;text-decoration:none;transition:color 0.15s;position:relative;padding-bottom:2px}
        .pub-nav-link:hover{color:#a78bfa}
        .pub-nav-link.pub-active{color:#a78bfa}
        .pub-nav-link.pub-active::after{content:'';position:absolute;bottom:-3px;left:0;right:0;height:1.5px;background:#a78bfa;border-radius:2px}
        @media(max-width:768px){.pub-hide-mobile{display:none !important}}
        .pub-card-hover{transition:transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease}
        .pub-card-hover:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.5)}
        .pub-share-btn:hover{color:#f1f5f9 !important}
        .pub-contact-link:hover{color:#a78bfa !important;border-color:rgba(124,58,237,0.35) !important}
      ` }} />

      {/* Ambient glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} aria-hidden>
        <div style={{ position:'absolute', width:900, height:700, top:-200, left:'50%', transform:'translateX(-50%)', background:'radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,transparent 65%)', filter:'blur(80px)' }}/>
        <div style={{ position:'absolute', width:600, height:600, top:'30%', left:-200, background:'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 65%)', filter:'blur(70px)' }}/>
        <div style={{ position:'absolute', width:500, height:500, top:'10%', right:-150, background:'radial-gradient(ellipse,rgba(236,72,153,0.07) 0%,transparent 65%)', filter:'blur(60px)' }}/>
      </div>

      {/* Sticky nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background: scrolled?'rgba(6,6,15,0.92)':'transparent', backdropFilter: scrolled?'blur(16px)':'none', borderBottom: scrolled?`1px solid ${BORDER}`:'1px solid transparent', transition:'all 0.25s ease' }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
              <span style={{ color:'#fff', fontWeight:900, fontSize:15 }}>T</span>
            </div>
            <span style={{ fontWeight:700, fontSize:18, color: TEXT, letterSpacing:'-0.02em' }}>Teachio</span>
          </Link>

          <div className="pub-hide-mobile" style={{ display:'flex', gap:28 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} className={`pub-nav-link${active?' pub-active':''}`}>{label}</Link>
              )
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {hasPlan && (
              <Link href="/studijni-plan" className="pub-hide-mobile pub-nav-link" style={{ color: pathname.startsWith('/studijni-plan') ? '#a78bfa' : MUTED }}>
                📅 Můj plán
              </Link>
            )}
            <Link href="/login" className="pub-hide-mobile"
              style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${BORDER2}`, color: MUTED, fontSize:14, fontWeight:600, textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = CARD2; e.currentTarget.style.color = TEXT }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = MUTED }}>
              Přihlásit se
            </Link>
            <Link href="/signup" className="pub-cta" style={{ padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(124,58,237,0.35)' }}>
              Začít zdarma
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ position:'relative', zIndex:1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background:'rgba(255,255,255,0.02)', padding: compact ? '32px 24px 24px' : '52px 24px 32px', borderTop:`1px solid ${BORDER}`, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          {!compact && (
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
                  {[['Obchodní podmínky','#'],['GDPR','#'],['Kontakt','mailto:hello@teachio.cz']].map(([l,h]) => (
                    <a key={l} href={h} style={{ fontSize:13, color: DIM, textDecoration:'none' }}>{l}</a>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:24 }}>
                {NAV_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} style={{ fontSize:13, color: DIM, textDecoration:'none' }}>{label}</Link>
                ))}
              </div>
            </div>
          )}
          <div style={{ borderTop: compact ? 'none' : `1px solid ${BORDER}`, paddingTop: compact ? 0 : 22, textAlign:'center', fontSize:13, color: DIM }}>
            © Teachio 2026 · Praha, Česko
          </div>
        </div>
      </footer>
    </div>
  )
}
