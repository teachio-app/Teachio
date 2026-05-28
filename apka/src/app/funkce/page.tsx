import type { Metadata } from 'next'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Funkce – Teachio | Chytré studium',
  description: 'Pět nástrojů. Jeden cíl — abys měl víc času na život. Studijní plán, podcast, kvíz, flashkarty a minihra z jednoho tématu.',
  openGraph: {
    title: 'Funkce – Teachio',
    description: 'Pět nástrojů. Jeden cíl — abys měl víc času na život.',
    url: 'https://apka-chi.vercel.app/funkce',
  },
}

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const BG2  = 'rgba(255,255,255,0.03)'
const BD   = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'

const FEATURES = [
  {
    emoji: '🗓️', accent: '#a78bfa', accentBg: 'rgba(124,58,237,0.10)',
    title: 'Studijní plán',
    headline: 'Den po dni. Až do zkoušky.',
    bullets: ['Zadáš termín — plán se napíše sám.', 'Rozdělí látku podle tvého času.', 'Posune se, když jeden den nestihneš.'],
    visual: (
      <div style={{ padding: '20px', background: 'rgba(124,58,237,0.06)', borderRadius: 14, border: '1px solid rgba(124,58,237,0.20)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📅 Plán na týden</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { d: 'Po', t: '1h', active: false },
            { d: 'Út', t: '45m', active: true },
            { d: 'St', t: '—', active: false },
            { d: 'Čt', t: '1h', active: false },
            { d: 'Pá', t: '30m', active: false },
            { d: 'So', t: '2h', active: false },
            { d: 'Ne', t: '—', active: false },
          ].map(({ d, t, active }) => (
            <div key={d} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: DIM, marginBottom: 4 }}>{d}</div>
              <div style={{ aspectRatio: '1', borderRadius: 8, background: active ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : t === '—' ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: active ? '#fff' : t === '—' ? DIM : '#c4b5fd' }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <div style={{ width: '32%', height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 6 }}>2 ze 7 dní splněno</div>
      </div>
    ),
  },
  {
    emoji: '🎧', accent: '#f472b6', accentBg: 'rgba(219,39,119,0.08)',
    title: 'Výukový podcast',
    headline: 'Uč se i v tramvaji.',
    bullets: ['Dva hlasy, jedna show.', '5–10 minut na kapitolu.', 'Offline přístup vždy po ruce.'],
    visual: (
      <div style={{ padding: '20px', background: 'rgba(219,39,119,0.06)', borderRadius: 14, border: '1px solid rgba(219,39,119,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f472b6', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎧 Živá epizoda</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: -4 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👩‍🏫</div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginLeft: -8 }}>👨‍🎓</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Fotosyntéza — ep. 1</div>
            <div style={{ fontSize: 11, color: MUT }}>7:24 minut</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 2, background: i < 10 ? '#f472b6' : 'rgba(255,255,255,0.12)', height: `${20 + Math.sin(i * 0.9) * 12}px` }} />
          ))}
        </div>
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg,#ec4899,#f97316)', borderRadius: 2 }} />
        </div>
      </div>
    ),
  },
  {
    emoji: '🧩', accent: '#34d399', accentBg: 'rgba(5,150,105,0.08)',
    title: 'Interaktivní kvíz',
    headline: 'Otestuj se. Pochop to.',
    bullets: ['5 otázek po každém tématu.', 'Okamžité vysvětlení u špatné odpovědi.', 'Sleduje, kde ti to plave.'],
    visual: (
      <div style={{ padding: '20px', background: 'rgba(5,150,105,0.06)', borderRadius: 14, border: '1px solid rgba(5,150,105,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🧩 Otázka 3 z 5</div>
        <div style={{ fontSize: 13, color: TEXT, marginBottom: 12, lineHeight: 1.5 }}>Co je primárním zdrojem energie pro fotosyntézu?</div>
        {[
          { text: 'Sluneční záření', correct: true },
          { text: 'Tepelná energie', correct: false },
          { text: 'Chemická energie vody', correct: false },
        ].map(({ text, correct }, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: correct ? 'rgba(5,150,105,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${correct ? 'rgba(5,150,105,0.35)' : BD}`, color: correct ? '#34d399' : MUT, fontSize: 13 }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: correct ? 'rgba(5,150,105,0.25)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{['A','B','C'][i]}</span>
            {text}
            {correct && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '🃏', accent: '#c084fc', accentBg: 'rgba(168,85,247,0.08)',
    title: 'Flashkarty',
    headline: 'Otoč. Zapamatuj. Hotovo.',
    bullets: ['3D otáčení jako u Quizletu.', 'Spaced repetition zabudovaný.', 'Export do Anki jedním klikem.'],
    visual: (
      <div style={{ padding: '20px', background: 'rgba(168,85,247,0.06)', borderRadius: 14, border: '1px solid rgba(168,85,247,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🃏 Karta 4 z 12</div>
        <div style={{ position: 'relative', height: 90 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(168,85,247,0.12)', borderRadius: 12, border: '1px solid rgba(168,85,247,0.25)', transform: 'rotate(-3deg)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,0.15)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.25)', transform: 'rotate(-1deg)' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#0e0b1e', borderRadius: 12, border: '1px solid rgba(168,85,247,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e9d5ff' }}>Chlorofyl</div>
            <div style={{ fontSize: 11, color: '#7c3aed' }}>Klikni pro definici →</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#c084fc' : 'rgba(255,255,255,0.12)' }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    emoji: '🕹️', accent: '#fbbf24', accentBg: 'rgba(245,158,11,0.08)',
    title: 'Minihra',
    headline: 'Učení, co tě baví.',
    bullets: ['Páruj pojmy s definicemi.', 'Sortuj časovou osu.', 'Žebříček mezi spolužáky.'],
    visual: (
      <div style={{ padding: '20px', background: 'rgba(245,158,11,0.06)', borderRadius: 14, border: '1px solid rgba(245,158,11,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🕹️ Páruj pojmy</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Chlorofyl', 'Zelené barvivo'],
            ['Stomata', 'Průduchy listu'],
            ['Glukóza', 'Cukr = energie'],
          ].map(([term, def], i) => (
            <>
              <div key={`t${i}`} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{term}</div>
              <div key={`d${i}`} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BD}`, fontSize: 12, color: MUT }}>{def}</div>
            </>
          ))}
        </div>
      </div>
    ),
  },
]

const COMPARISON = [
  'Generuje obsah z tématu za 10 vteřin',
  'Výukový podcast ve dvou hlasech',
  'Kvíz s okamžitým vysvětlením',
  'Flashkarty se spaced repetition',
  'Studijní plán den po dni',
  'Minihra pro zapamatování pojmů',
  'Žádná instalace, funguje v prohlížeči',
  'Přizpůsobení pro SŠ, VŠ i maturitu',
]

export default function FunkcePage() {
  return (
    <PublicShell>
      {/* ── HERO ── */}
      <section style={{ padding: '96px 24px 80px', textAlign: 'center', maxWidth: 740, margin: '0 auto' }}>
        <div className="pub-au pub-au1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', boxShadow: '0 0 6px #a78bfa' }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>✨ Funkce</span>
        </div>
        <h1 className="pub-au pub-au2" style={{ ...serif, fontSize: 'clamp(36px,6vw,58px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20, color: TEXT }}>
          Všechno, co potřebuješ.<br/>
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nic navíc.</span>
        </h1>
        <p className="pub-au pub-au3" style={{ fontSize: 18, color: MUT, lineHeight: 1.68, marginBottom: 36 }}>
          Pět nástrojů. Jeden cíl — abys měl/a víc času na život.
        </p>
        <Link href="/signup" className="pub-au pub-au4 pub-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
          Vyzkoušet zdarma →
        </Link>
      </section>

      {/* ── FEATURE SECTIONS ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        {FEATURES.map((f, i) => (
          <div key={f.title} className="pub-au" style={{ animationDelay: `${0.05 * i}s`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center', marginBottom: 80, flexDirection: i % 2 === 1 ? 'row-reverse' : 'row' }}>
            <div style={{ order: i % 2 === 1 ? 1 : 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, background: f.accentBg, border: `1px solid ${f.accent}33`, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>{f.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: f.accent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{f.title}</span>
              </div>
              <h2 style={{ ...serif, fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: TEXT, lineHeight: 1.2, marginBottom: 20 }}>{f.headline}</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {f.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: MUT, lineHeight: 1.6 }}>
                    <span style={{ color: f.accent, flexShrink: 0, marginTop: 2 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ order: i % 2 === 1 ? 0 : 1 }}>
              {f.visual}
            </div>
          </div>
        ))}
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Porovnání</p>
          <h2 className="pub-au" style={{ ...serif, fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 48 }}>
            Proč Teachio?
          </h2>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.05)', borderBottom: `1px solid ${BD}` }}>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: MUT }}>Funkce</div>
              <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 800, color: '#a78bfa', background: 'rgba(124,58,237,0.10)', textAlign: 'center' }}>Teachio ✓</div>
              <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: DIM, textAlign: 'center' }}>Běžné AI ✗</div>
              <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: DIM, textAlign: 'center' }}>Jiné appky ✗</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: i % 2 === 0 ? BG2 : 'rgba(255,255,255,0.05)', borderBottom: i < COMPARISON.length - 1 ? `1px solid ${BD}` : 'none' }}>
                <div style={{ padding: '12px 20px', fontSize: 13, color: MUT }}>{row}</div>
                <div style={{ padding: '12px 16px', textAlign: 'center', background: 'rgba(124,58,237,0.06)', fontSize: 16, color: '#a78bfa', fontWeight: 700 }}>✓</div>
                <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16, color: DIM }}>✗</div>
                <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 16, color: DIM }}>✗</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', maxWidth: 860, margin: '0 auto' }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Jak to funguje</p>
        <h2 style={{ ...serif, fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, color: TEXT, textAlign: 'center', marginBottom: 56 }}>Tři kroky. Hotovo.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {[
            { step: '01', emoji: '📝', title: 'Zadej téma nebo hoď zápisky.', desc: 'Napiš téma nebo nahraj PDF/DOCX. Teachio se postará o zbytek.' },
            { step: '02', emoji: '⚡', title: 'AI vytvoří všech 5 nástrojů.', desc: 'Za pár vteřin máš podcast, kvíz, flashkarty, hru i studijní plán.' },
            { step: '03', emoji: '📈', title: 'Učíš se a sleduješ pokrok.', desc: 'Každý den nový krok v plánu, každá kapitola blíž ke zkoušce.' },
          ].map(({ step, emoji, title, desc }) => (
            <div key={step} className="pub-au" style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(168,85,247,0.25))', border: `1px solid rgba(124,58,237,0.30)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>{emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', marginBottom: 8 }}>KROK {step}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 8, lineHeight: 1.4 }}>{title}</h3>
              <p style={{ fontSize: 14, color: MUT, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '60px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '52px 40px', borderRadius: 24, background: 'linear-gradient(135deg,rgba(79,46,220,0.25),rgba(124,58,237,0.18) 50%,rgba(168,85,247,0.15))', border: `1px solid rgba(124,58,237,0.25)` }}>
          <h2 style={{ ...serif, fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, color: TEXT, marginBottom: 20, lineHeight: 1.2 }}>Připraven/a začít?</h2>
          <p style={{ fontSize: 15, color: MUT, marginBottom: 28 }}>Zadej první téma a Teachio ukáže, co umí.</p>
          <Link href="/signup" className="pub-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
            Vyzkoušet zdarma →
          </Link>
          <p style={{ fontSize: 12, color: DIM, marginTop: 14 }}>Žádná kreditní karta · Okamžitý přístup</p>
        </div>
      </section>
    </PublicShell>
  )
}
