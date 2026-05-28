'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'
const BD   = 'rgba(255,255,255,0.08)'
const BG2  = 'rgba(255,255,255,0.03)'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DayPlan {
  dayNumber: number
  date: string
  phase: string
  title: string
  mainTask: string
  estimatedMinutes: number
  learningTip?: string
  todaysMood?: string
  isToday?: boolean
  specificSteps?: string[]
  interestingFact?: string
  flashcardPrompt?: string[]
  podcastHint?: string
}

interface FullPlan {
  id: string
  subject: string
  examDate: string
  days?: DayPlan[]
}

type Tab = 'study' | 'kviz' | 'karty' | 'hra'

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysLeft(examDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.max(0, Math.round((new Date(examDate).getTime() - today.getTime()) / 86400000))
}

// ── Fallback content ───────────────────────────────────────────────────────────
// Used when AI didn't produce specificSteps or flashcardPrompt for this lesson.
// TODO: Replace with a call to /api/generate-lesson-content for richer AI content.

function fallbackSteps(subject: string, title: string): string[] {
  return [
    `Přečti si kapitolu věnovanou tématu „${title}" ve svých studijních materiálech.`,
    `Vypiš si 5 klíčových pojmů, které si musíš zapamatovat — bez koukání do textu.`,
    `Vysvětli hlavní myšlenku vlastními slovy, jako by sis to vysvětloval/a kamarádovi.`,
    `Porovnej svůj výklad s učebnicí a doplň, co chybí.`,
    `Zopakuj 3× pojmy, které se ti zdají nejtěžší — metodou aktivního vzpomínání.`,
  ]
}

function fallbackCards(subject: string, title: string): string[] {
  return [
    `${title}: Klíčové téma z předmětu ${subject}`,
    `Definice: Souhrn znalostí a konceptů vztahujících se k tématu ${title}`,
    `Příklad: Praktická aplikace poznatků z tématu ${title} v reálné situaci`,
    `Kontext: Historické nebo vědecké pozadí tématu ${title}`,
    `Souvislosti: Jak téma ${title} navazuje na další části předmětu ${subject}`,
  ]
}

// ── Card parser ────────────────────────────────────────────────────────────────

function parseCard(raw: string): { term: string; def: string } {
  const sepIdx = raw.indexOf(': ')
  if (sepIdx > 0 && sepIdx < 80) return { term: raw.slice(0, sepIdx), def: raw.slice(sepIdx + 2) }
  const qIdx = raw.indexOf('? ')
  if (qIdx > 0 && qIdx < 80) return { term: raw.slice(0, qIdx + 1), def: raw.slice(qIdx + 2) }
  return { term: raw, def: '' }
}

// ── Study tab ──────────────────────────────────────────────────────────────────

function StudyView({ day, subject }: { day: DayPlan; subject: string }) {
  const steps = (day.specificSteps?.length ?? 0) > 0
    ? day.specificSteps!
    : fallbackSteps(subject, day.title)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {day.mainTask && (
        <div style={{ padding: '20px 24px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cíl lekce</div>
          <p style={{ fontSize: 14, color: MUT, lineHeight: 1.75, margin: 0 }}>{day.mainTask}</p>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Postup – krok za krokem</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', background: BG2, border: `1px solid ${BD}`, borderRadius: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <p style={{ fontSize: 13, color: MUT, lineHeight: 1.7, flex: 1, margin: 0 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {day.interestingFact && (
        <div style={{ padding: '14px 18px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 14, fontSize: 13, color: '#c4b5fd', lineHeight: 1.7 }}>
          🌟 {day.interestingFact}
        </div>
      )}

      {day.learningTip && (
        <div style={{ padding: '14px 18px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, fontSize: 13, color: '#818cf8', lineHeight: 1.7 }}>
          💡 {day.learningTip}
        </div>
      )}

      {day.podcastHint && (
        <div style={{ padding: '14px 18px', background: 'rgba(244,114,182,0.07)', border: '1px solid rgba(244,114,182,0.20)', borderRadius: 14, fontSize: 13, color: '#f9a8d4', lineHeight: 1.7 }}>
          🎧 <strong style={{ color: '#f472b6' }}>Tip na podcast:</strong> {day.podcastHint}
        </div>
      )}
    </div>
  )
}

// ── Quiz tab ───────────────────────────────────────────────────────────────────

function QuizView({ day, subject }: { day: DayPlan; subject: string }) {
  const cards = useMemo(() =>
    ((day.flashcardPrompt?.length ?? 0) > 0 ? day.flashcardPrompt! : fallbackCards(subject, day.title)).map(parseCard),
  [day, subject])

  const [current,  setCurrent]  = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct,  setCorrect]  = useState(0)
  const [done,     setDone]     = useState(false)

  if (done) return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <h3 style={{ ...serif, fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Kvíz dokončen!</h3>
      <p style={{ fontSize: 15, color: MUT, marginBottom: 28 }}>Správně: <strong style={{ color: '#4ade80' }}>{correct}</strong> / {cards.length}</p>
      <button onClick={() => { setCurrent(0); setCorrect(0); setDone(false); setRevealed(false) }}
        style={{ padding: '10px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.40)' }}>
        Zopakovat kvíz
      </button>
    </div>
  )

  const card = cards[current]

  const next = (isCorrect: boolean) => {
    if (isCorrect) setCorrect(c => c + 1)
    if (current + 1 >= cards.length) setDone(true)
    else { setCurrent(c => c + 1); setRevealed(false) }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: DIM }}>Otázka {current + 1} / {cards.length}</span>
        <span style={{ fontSize: 12, color: '#4ade80' }}>✓ {correct} správně</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24 }}>
        <div style={{ width: `${((current + 1) / cards.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ padding: '28px 24px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 20, marginBottom: 16, textAlign: 'center', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.5, margin: 0 }}>{card.term}</p>
      </div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)}
          style={{ width: '100%', padding: '12px', borderRadius: 14, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Zobrazit odpověď
        </button>
      ) : (
        <div>
          <div style={{ padding: '18px 20px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 16, marginBottom: 14 }}>
            <p style={{ fontSize: 14, color: '#86efac', lineHeight: 1.65, margin: 0 }}>{card.def || '—'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => next(false)}
              style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#fca5a5', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ✗ Nevěděl/a jsem
            </button>
            <button onClick={() => next(true)}
              style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.28)', color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              ✓ Věděl/a jsem
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Flashcards tab ─────────────────────────────────────────────────────────────

function CardsView({ day, subject }: { day: DayPlan; subject: string }) {
  const cards = useMemo(() =>
    ((day.flashcardPrompt?.length ?? 0) > 0 ? day.flashcardPrompt! : fallbackCards(subject, day.title)).map(parseCard),
  [day, subject])

  const [idx,     setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = cards[idx]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: DIM }}>Karta {idx + 1} / {cards.length}</span>
        <span style={{ fontSize: 12, color: MUT }}>Klikni pro otočení</span>
      </div>

      <div onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer' }}>
        <div style={{
          padding: '52px 32px', borderRadius: 20, textAlign: 'center',
          minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: flipped ? 'rgba(74,222,128,0.07)' : 'rgba(124,58,237,0.12)',
          border: flipped ? '1px solid rgba(74,222,128,0.32)' : '1px solid rgba(124,58,237,0.38)',
          transition: 'background 0.3s ease, border-color 0.3s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.30)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: flipped ? '#86efac' : '#a78bfa', marginBottom: 18 }}>
            {flipped ? 'ODPOVĚĎ' : 'POJEM'}
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.55, margin: 0 }}>
            {flipped ? (card.def || '—') : card.term}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
          disabled={idx === 0}
          style={{ flex: 1, padding: '10px', borderRadius: 12, background: BG2, border: `1px solid ${BD}`, color: idx === 0 ? DIM : MUT, fontSize: 13, fontWeight: 700, cursor: idx === 0 ? 'default' : 'pointer' }}>
          ← Předchozí
        </button>
        <button
          onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }}
          disabled={idx === cards.length - 1}
          style={{ flex: 1, padding: '10px', borderRadius: 12, background: BG2, border: `1px solid ${BD}`, color: idx === cards.length - 1 ? DIM : MUT, fontSize: 13, fontWeight: 700, cursor: idx === cards.length - 1 ? 'default' : 'pointer' }}>
          Další →
        </button>
      </div>
    </div>
  )
}

// ── Game tab (pair matching) ───────────────────────────────────────────────────

function GameView({ day, subject }: { day: DayPlan; subject: string }) {
  const pairs = useMemo(() =>
    ((day.flashcardPrompt?.length ?? 0) > 0 ? day.flashcardPrompt! : fallbackCards(subject, day.title))
      .map(parseCard)
      .filter(c => c.def.length > 0)
      .slice(0, 5),
  [day, subject])

  const [shuffledDefs, setShuffledDefs] = useState<{ idx: number; text: string }[]>([])
  const [selected,     setSelected]     = useState<{ type: 'term' | 'def'; idx: number } | null>(null)
  const [matched,      setMatched]      = useState<number[]>([])
  const [wrongPair,    setWrongPair]    = useState<[number, number] | null>(null)
  const [done,         setDone]         = useState(false)

  useEffect(() => {
    const defs = pairs.map((p, i) => ({ idx: i, text: p.def }))
    for (let i = defs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [defs[i], defs[j]] = [defs[j], defs[i]]
    }
    setShuffledDefs(defs)
  }, [pairs])

  const reset = () => {
    const defs = pairs.map((p, i) => ({ idx: i, text: p.def }))
    for (let i = defs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [defs[i], defs[j]] = [defs[j], defs[i]]
    }
    setShuffledDefs(defs)
    setMatched([]); setSelected(null); setWrongPair(null); setDone(false)
  }

  const handleSelect = (type: 'term' | 'def', idx: number) => {
    if (matched.includes(idx)) return
    if (!selected) { setSelected({ type, idx }); return }
    if (selected.type === type) { setSelected({ type, idx }); return }

    const termIdx = type === 'def' ? selected.idx : idx
    const defIdx  = type === 'def' ? idx          : selected.idx

    if (termIdx === defIdx) {
      const next = [...matched, termIdx]
      setMatched(next)
      if (next.length === pairs.length) setDone(true)
    } else {
      setWrongPair([termIdx, defIdx])
      setTimeout(() => setWrongPair(null), 650)
    }
    setSelected(null)
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏆</div>
      <h3 style={{ ...serif, fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Skvělá práce!</h3>
      <p style={{ fontSize: 15, color: MUT, marginBottom: 28 }}>Všechny pojmy správně spárovány.</p>
      <button onClick={reset}
        style={{ padding: '10px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.40)' }}>
        Hrát znovu
      </button>
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: 13, color: MUT, textAlign: 'center', marginBottom: 24 }}>
        Spáruj pojmy s definicemi — klikni na pojem, pak na odpovídající definici.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Terms column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((p, i) => {
            const isMatched  = matched.includes(i)
            const isSelected = selected?.type === 'term' && selected.idx === i
            const isWrong    = wrongPair?.[0] === i
            return (
              <button key={i} onClick={() => handleSelect('term', i)} disabled={isMatched}
                style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, lineHeight: 1.45, cursor: isMatched ? 'default' : 'pointer', transition: 'all 0.15s',
                  background: isMatched ? 'rgba(74,222,128,0.10)' : isWrong ? 'rgba(239,68,68,0.12)' : isSelected ? 'rgba(124,58,237,0.22)' : BG2,
                  border:     isMatched ? '1px solid rgba(74,222,128,0.35)' : isWrong ? '1px solid rgba(239,68,68,0.35)' : isSelected ? '1px solid rgba(124,58,237,0.55)' : `1px solid ${BD}`,
                  color:      isMatched ? '#86efac' : isWrong ? '#fca5a5' : isSelected ? '#c4b5fd' : MUT,
                }}>
                {p.term}
              </button>
            )
          })}
        </div>

        {/* Definitions column (shuffled) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledDefs.map(({ idx: di, text }) => {
            const isMatched  = matched.includes(di)
            const isSelected = selected?.type === 'def' && selected.idx === di
            const isWrong    = wrongPair?.[1] === di
            return (
              <button key={di} onClick={() => handleSelect('def', di)} disabled={isMatched}
                style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, lineHeight: 1.45, cursor: isMatched ? 'default' : 'pointer', transition: 'all 0.15s',
                  background: isMatched ? 'rgba(74,222,128,0.10)' : isWrong ? 'rgba(239,68,68,0.12)' : isSelected ? 'rgba(124,58,237,0.22)' : BG2,
                  border:     isMatched ? '1px solid rgba(74,222,128,0.35)' : isWrong ? '1px solid rgba(239,68,68,0.35)' : isSelected ? '1px solid rgba(124,58,237,0.55)' : `1px solid ${BD}`,
                  color:      isMatched ? '#86efac' : isWrong ? '#fca5a5' : isSelected ? '#c4b5fd' : MUT,
                }}>
                {text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS: { key: Tab; emoji: string; label: string }[] = [
  { key: 'study', emoji: '📖', label: 'Studium' },
  { key: 'kviz',  emoji: '🧩', label: 'Kvíz'    },
  { key: 'karty', emoji: '🃏', label: 'Karty'   },
  { key: 'hra',   emoji: '🕹️', label: 'Hra'      },
]

export default function LessonPage() {
  const params   = useParams()
  const id       = params?.id       as string
  const lessonId = params?.lessonId as string

  const [plan,    setPlan]    = useState<FullPlan | null>(null)
  const [day,     setDay]     = useState<DayPlan  | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('study')

  // Read ?act= from URL without useSearchParams (avoids Suspense wrapper requirement)
  useEffect(() => {
    const sp  = new URLSearchParams(window.location.search)
    const act = sp.get('act') as Tab | null
    if (act && TABS.some(t => t.key === act)) setTab(act)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`teachio:plan:${id}`)
      if (raw) {
        const p = JSON.parse(raw) as FullPlan
        setPlan(p)
        const dayNum = parseInt(lessonId, 10)
        const d = p.days?.find(d => d.dayNumber === dayNum) ?? p.days?.[0] ?? null
        setDay(d)
      }
    } catch {}
    setLoading(false)
  }, [id, lessonId])

  if (loading) return (
    <PublicShell compact>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: MUT }}>Načítám lekci…</div>
    </PublicShell>
  )

  if (!plan || !day) return (
    <PublicShell compact>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
        <h2 style={{ ...serif, fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 12 }}>Lekce nenalezena</h2>
        <p style={{ fontSize: 14, color: MUT, marginBottom: 24 }}>Lekce nebyla nalezena v uloženém plánu.</p>
        <Link href="/studijni-plan" style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Moje plány
        </Link>
      </div>
    </PublicShell>
  )

  const dl         = daysLeft(plan.examDate)
  const totalDays  = plan.days?.length ?? 0

  return (
    <PublicShell compact>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Back */}
        <Link href={`/studijni-plan/${id}`}
          style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, color: DIM, textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}>
          ← Zpět na plán
        </Link>

        {/* Lesson header */}
        <div style={{ padding: '24px 28px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Den {day.dayNumber} · {day.phase}
              </div>
              <h1 style={{ ...serif, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: TEXT, lineHeight: 1.2, marginBottom: 4 }}>
                {day.title}
              </h1>
              <div style={{ fontSize: 13, color: MUT }}>{plan.subject}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ padding: '6px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.32)', fontSize: 12, fontWeight: 700, color: '#a78bfa', whiteSpace: 'nowrap' }}>
                {dl} dní do zkoušky
              </div>
              <div style={{ fontSize: 11, color: DIM }}>⏱ {day.estimatedMinutes} min</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, padding: '4px', background: BG2, border: `1px solid ${BD}`, borderRadius: 14, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
                background: tab === t.key ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'transparent',
                color:      tab === t.key ? '#fff' : MUT,
                boxShadow:  tab === t.key ? '0 2px 10px rgba(124,58,237,0.35)' : 'none',
              }}>
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'study' && <StudyView day={day} subject={plan.subject} />}
        {tab === 'kviz'  && <QuizView  day={day} subject={plan.subject} />}
        {tab === 'karty' && <CardsView day={day} subject={plan.subject} />}
        {tab === 'hra'   && <GameView  day={day} subject={plan.subject} />}

        {/* Lesson navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
          {day.dayNumber > 1 && (
            <Link href={`/studijni-plan/${id}/lekce/${day.dayNumber - 1}`}
              style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 12, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              ← Předchozí lekce
            </Link>
          )}
          {day.dayNumber < totalDays && (
            <Link href={`/studijni-plan/${id}/lekce/${day.dayNumber + 1}`}
              style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
              Další lekce →
            </Link>
          )}
        </div>

      </div>
    </PublicShell>
  )
}
