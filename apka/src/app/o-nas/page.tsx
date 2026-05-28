import type { Metadata } from 'next'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'O nás – Teachio | Naše příběh',
  description: 'Petr Pech a Jakub Hradecký postavili Teachio, protože chtěli studovat chytřeji. Přečti si jejich příběh.',
  openGraph: {
    title: 'O nás – Teachio',
    description: 'Petr Pech a Jakub Hradecký postavili Teachio, protože chtěli studovat chytřeji.',
    url: 'https://apka-chi.vercel.app/o-nas',
  },
}

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const BG2  = 'rgba(255,255,255,0.03)'
const BD   = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'

const MILESTONES = [
  { year: 'Jaro 2024',   text: 'První prototyp v noci před chemií. Funguje.' },
  { year: 'Léto 2024',   text: 'Beta s 30 spolužáky. 28 zůstává.' },
  { year: 'Podzim 2024', text: 'Teachio přechází z notesu do prohlížeče.' },
  { year: 'Jaro 2025',   text: 'První škola používá Teachio v hodině.' },
  { year: '2026',        text: 'Tisíce studentů, padesát učitelů, jedna mise.' },
]

const STATS = [
  { num: '12 000+', label: 'Aktivních studentů' },
  { num: '850 000+', label: 'Vygenerovaných materiálů' },
  { num: '50+', label: 'Partnerských škol' },
  { num: '4,8 ★', label: 'Průměrné hodnocení' },
]

export default function ONasPage() {
  return (
    <PublicShell>
      {/* ── HERO ── */}
      <section style={{ padding: '96px 24px 80px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <div className="pub-au pub-au1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>💜 Naše příběh</span>
        </div>
        <h1 className="pub-au pub-au2" style={{ ...serif, fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 24, color: TEXT }}>
          Začalo to u dvou propadlých testů.
        </h1>
        <p className="pub-au pub-au3" style={{ fontSize: 17, color: MUT, lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
          Petr s Kubou se potkali na střední v Praze v roce 2023. Po jednom katastrofálním pátku z chemie si řekli, že to musí jít líp.
        </p>
      </section>

      {/* ── FOUNDERS ── */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            {
              initials: 'PP', color: '#7c3aed', name: 'Petr Pech',
              role: 'Spoluzakladatel & produkt',
              bio: 'Bývalý student gymnázia, který si AI nechtěl jen půjčovat, ale postavit si vlastní. Stará se o vizi a uživatelský zážitek Teachia.',
              quote: '„Učení nemá být boj. Má být klika ke všemu ostatnímu."',
            },
            {
              initials: 'JH', color: '#2563eb', name: 'Jakub Hradecký',
              role: 'Spoluzakladatel & technologie',
              bio: 'Programátor od čtrnácti, samouk, fanoušek čistého kódu i čisté kávy. Stojí za AI modelem, který Teachio pohání.',
              quote: '„Nejlepší kód je ten, který se vejde do hlavy. Nejlepší appka taky."',
            },
          ].map(f => (
            <div key={f.name} className="pub-au pub-card-hover" style={{ background: BG2, border: `1px solid ${BD}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0, boxShadow: `0 0 24px ${f.color}50` }}>{f.initials}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>{f.name}</div>
                  <div style={{ fontSize: 13, color: MUT, marginTop: 2 }}>{f.role}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0 }}>{f.bio}</p>
              <div style={{ padding: '14px 18px', background: `${f.color}12`, borderRadius: 12, border: `1px solid ${f.color}25` }}>
                <p style={{ ...serif, fontSize: 15, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>{f.quote}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['LinkedIn', 'GitHub', 'Twitter'].map(s => (
                  <a key={s} href="#" style={{ fontSize: 12, fontWeight: 600, color: DIM, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, border: `1px solid ${BD}`, transition: 'all 0.15s' }}>{s}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="pub-au" style={{ ...serif, fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 56 }}>Jak to šlo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="pub-au" style={{ animationDelay: `${0.08 * i}s`, display: 'flex', gap: 24, paddingBottom: i < MILESTONES.length - 1 ? 32 : 0, position: 'relative' }}>
                {i < MILESTONES.length - 1 && (
                  <div style={{ position: 'absolute', left: 20, top: 40, bottom: 0, width: 1, background: 'linear-gradient(to bottom, rgba(124,58,237,0.4), transparent)' }} />
                )}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 900, flexShrink: 0, boxShadow: '0 4px 16px rgba(124,58,237,0.35)', zIndex: 1 }}>{i + 1}</div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{m.year}</div>
                  <div style={{ fontSize: 15, color: TEXT, lineHeight: 1.6 }}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISE ── */}
      <section style={{ padding: '100px 24px', maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="pub-au" style={{ ...serif, fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: TEXT, marginBottom: 24 }}>
          Učení patří studentům, ne nástrojům.
        </h2>
        <p className="pub-au pub-au2" style={{ fontSize: 16, color: MUT, lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
          Věříme, že každý student si zaslouží učit se chytře — bez prokrastinace nad PDF, bez hodin v zápiskách, bez stresu týden před zkouškou. Stavíme nástroj, který bychom si přáli mít sami. A který chceme, aby vydržel.
        </p>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {STATS.map(({ num, label }, i) => (
            <div key={label} className="pub-au pub-card-hover" style={{ animationDelay: `${0.08 * i}s`, textAlign: 'center', padding: '28px 20px', background: BG2, border: `1px solid ${BD}`, borderRadius: 20 }}>
              <div style={{ ...serif, fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 6 }}>{num}</div>
              <div style={{ fontSize: 13, color: MUT, lineHeight: 1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRO UČITELE ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 40px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32 }}>👩‍🏫</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Učitelé: chceš Teachio ve své třídě?</div>
            <div style={{ fontSize: 13, color: MUT }}>Pomůžeme ti integrovat Teachio do výuky. Školení zdarma.</div>
          </div>
          <a href="mailto:hello@teachio.cz?subject=Demo pro školu" className="pub-cta" style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}>
            Domluvit demo
          </a>
        </div>
      </section>

      {/* ── KONTAKT ── */}
      <section style={{ padding: '0 24px 100px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '✉', text: 'hello@teachio.cz', href: 'mailto:hello@teachio.cz' },
            { icon: '📍', text: 'Praha, Česko', href: '#' },
            { icon: '💬', text: '@teachio', href: '#' },
          ].map(({ icon, text, href }) => (
            <a key={text} href={href} className="pub-contact-link" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 20px', borderRadius: 100, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 14, textDecoration: 'none', transition: 'all 0.15s' }}>
              <span>{icon}</span><span>{text}</span>
            </a>
          ))}
        </div>
      </section>
    </PublicShell>
  )
}
