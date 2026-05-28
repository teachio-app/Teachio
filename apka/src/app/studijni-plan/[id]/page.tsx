'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'
const BD   = 'rgba(255,255,255,0.08)'
const BG2  = 'rgba(255,255,255,0.03)'

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

interface Phase {
  name: string
  emoji: string
  startDay: number
  endDay: number
  tagline: string
}

interface FullPlan {
  id: string
  subject: string
  examDate: string
  dailyMinutes: number
  createdAt: string
  totalSessions: number
  completedSessions: number
  motivation?: string
  phases?: Phase[]
  days?: DayPlan[]
}

function daysLeft(examDate: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.max(0, Math.round((new Date(examDate).getTime() - today.getTime()) / 86400000))
}

function formatDate(iso: string, short = false): string {
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', short
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
    )
  } catch { return iso }
}

function formatWeekDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'short' })
  } catch { return '' }
}

const PHASE_COLORS: Record<string, string> = {
  'ÚVOD': '#6366f1',
  'PROHLUBOVÁNÍ': '#7c3aed',
  'PROCVIČENÍ': '#059669',
  'OPAKOVÁNÍ': '#d97706',
  'FINALE': '#ec4899',
}

export default function PlanDashboardPage() {
  const params  = useParams()
  const id = params?.id as string

  const [plan, setPlan]       = useState<FullPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState<DayPlan | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`teachio:plan:${id}`)
      if (raw) {
        const p = JSON.parse(raw) as FullPlan
        setPlan(p)
        const todayDay = p.days?.find(d => d.isToday) ?? p.days?.[0] ?? null
        setActiveDay(todayDay)
      }
    } catch {}
    setLoading(false)
  }, [id])

  const markComplete = (dayNum: number) => {
    if (!plan) return
    const doneCount = Math.min((plan.completedSessions ?? 0) + 1, plan.totalSessions)
    // Advance isToday to the next incomplete lesson so the card auto-advances
    const updatedDays = (plan.days ?? []).map((d, i) => ({
      ...d,
      isToday: i === doneCount,
    }))
    const updated = { ...plan, completedSessions: doneCount, days: updatedDays }
    setPlan(updated)
    try {
      localStorage.setItem(`teachio:plan:${id}`, JSON.stringify(updated))
      const listRaw = localStorage.getItem('teachio:plans:v1')
      if (listRaw) {
        const list = JSON.parse(listRaw) as FullPlan[]
        const idx = list.findIndex(p => p.id === id)
        if (idx >= 0) {
          list[idx] = { ...list[idx], completedSessions: doneCount }
          localStorage.setItem('teachio:plans:v1', JSON.stringify(list))
        }
      }
    } catch {}
  }

  if (loading) return (
    <PublicShell compact>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: MUT }}>Načítám plán…</div>
    </PublicShell>
  )

  if (!plan) return (
    <PublicShell compact>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
        <h2 style={{ ...serif, fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 12 }}>Plán nenalezen</h2>
        <p style={{ fontSize: 14, color: MUT, marginBottom: 24 }}>Tento plán nebyl nalezen v tvém prohlížeči.</p>
        <Link href="/studijni-plan" style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Moje plány
        </Link>
      </div>
    </PublicShell>
  )

  const dl      = daysLeft(plan.examDate)
  const total   = plan.totalSessions || 1
  const done    = plan.completedSessions ?? 0
  const pct     = Math.round((done / total) * 100)
  const radius  = 52
  const circ    = 2 * Math.PI * radius
  const offset  = circ * (1 - pct / 100)

  // Derived from state — re-evaluates after markComplete updates plan.days
  const todayDay   = plan.days?.find(d => d.isToday) ?? plan.days?.[done] ?? plan.days?.[0]
  const allDays    = plan.days ?? []
  const phaseColor = (phase: string) => PHASE_COLORS[phase.toUpperCase().split(' ')[0]] ?? '#7c3aed'

  const todayIdx  = allDays.findIndex(d => d.isToday)
  const weekStart = Math.max(0, (todayIdx >= 0 ? todayIdx : 0) + weekOffset * 7)
  const weekDays  = allDays.slice(weekStart, weekStart + 7)

  // Activity links: open lesson page pre-seeded to the right tab
  const lessonHref = (day: DayPlan, act?: string) =>
    `/studijni-plan/${id}/lekce/${day.dayNumber}${act ? `?act=${act}` : ''}`

  return (
    <PublicShell compact>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Back link */}
        <Link href="/studijni-plan" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, color: DIM, textDecoration: 'none', marginBottom: 28 }}>
          ← Moje plány
        </Link>

        {/* TOP HERO */}
        <div className="pub-au" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 28 }}>
          {/* Left: title + countdown */}
          <div style={{ padding: '28px 32px', background: BG2, border: '1px solid rgba(124,58,237,0.18)', borderRadius: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Studijní plán</div>
            <h1 style={{ ...serif, fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 10 }}>{plan.subject}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: MUT }}>
                <span>📍</span>
                <span><strong style={{ color: TEXT }}>{dl}</strong> dní · {formatDate(plan.examDate)}</span>
              </div>
            </div>
            {plan.motivation && (
              <p style={{ fontSize: 13, color: MUT, lineHeight: 1.65, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BD}` }}>{plan.motivation}</p>
            )}
          </div>

          {/* Right: progress ring */}
          <div style={{ padding: '28px 32px', background: BG2, border: `1px solid ${BD}`, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={124} height={124}>
                <circle cx={62} cy={62} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                <circle ref={ringRef} cx={62} cy={62} r={radius} fill="none"
                  stroke="url(#ring-grad)" strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 62 62)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa' }}>{pct}%</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: TEXT }}>{done} <span style={{ fontSize: 14, color: MUT, fontWeight: 500 }}>ze {total}</span></div>
              <div style={{ fontSize: 14, color: MUT, marginBottom: 6 }}>lekcí splněno</div>
              <div style={{ fontSize: 12, color: DIM }}>{total - done} zbývá</div>
            </div>
          </div>
        </div>

        {/* DAY STRIP */}
        {allDays.length > 0 && (
          <div className="pub-au" style={{ marginBottom: 28, padding: '16px', background: BG2, border: `1px solid ${BD}`, borderRadius: 16, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
              {allDays.slice(0, Math.min(allDays.length, 40)).map((d, i) => {
                const isToday  = d.isToday
                const isDone   = i < done
                const isMissed = !isToday && !isDone && i < (todayIdx >= 0 ? todayIdx : 0)
                const color    = isDone ? '#4ade80' : isMissed ? '#fca5a5' : isToday ? '#a78bfa' : 'rgba(255,255,255,0.12)'
                return (
                  <div key={d.dayNumber}
                    title={`${formatDate(d.date, true)} — ${d.title || 'Den ' + d.dayNumber}`}
                    onClick={() => { setActiveDay(d); setShowDrawer(true) }}
                    style={{ width: 24, height: 24, borderRadius: 6, background: color, flexShrink: 0, cursor: 'pointer', transition: 'transform 0.15s', boxShadow: isToday ? `0 0 10px ${color}80` : 'none', animation: isToday ? 'pub-fadeUp 1.5s ease-in-out infinite alternate' : 'none' }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: DIM }}>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#4ade80', display: 'inline-block' }} />Splněno</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#a78bfa', display: 'inline-block' }} />Dnes</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#fca5a5', display: 'inline-block' }} />Zameškáno</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} />Čeká</span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* TODAY CARD */}
          {todayDay && (
            <div className="pub-au" style={{ padding: '24px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                {todayDay.todaysMood} Dnes na tebe čeká
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8, lineHeight: 1.3 }}>{todayDay.title}</h2>
              <p style={{ fontSize: 14, color: MUT, lineHeight: 1.65, marginBottom: 16 }}>{todayDay.mainTask}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ padding: '4px 10px', borderRadius: 100, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)', fontSize: 11, fontWeight: 700, color: '#c4b5fd' }}>⏱ {todayDay.estimatedMinutes} min</span>
                <span style={{ padding: '4px 10px', borderRadius: 100, background: `${phaseColor(todayDay.phase)}20`, border: `1px solid ${phaseColor(todayDay.phase)}40`, fontSize: 11, fontWeight: 700, color: phaseColor(todayDay.phase) }}>{todayDay.phase}</span>
              </div>

              {/* Activity buttons — all open the lesson view, each on the right tab */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {([
                  { emoji: '🎧', label: 'Podcast', act: 'podcast', color: '#f472b6' },
                  { emoji: '🧩', label: 'Kvíz',    act: 'kviz',    color: '#34d399' },
                  { emoji: '🃏', label: 'Karty',   act: 'karty',   color: '#a78bfa' },
                  { emoji: '🕹️', label: 'Hra',     act: 'hra',     color: '#fbbf24' },
                ] as const).map(t => (
                  <Link key={t.label} href={lessonHref(todayDay, t.act)}
                    style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: BG2, border: `1px solid ${BD}`, textDecoration: 'none', fontSize: 13, fontWeight: 600, color: t.color, transition: 'all 0.15s' }}>
                    <span>{t.emoji}</span><span>{t.label}</span>
                  </Link>
                ))}
              </div>

              <Link href={lessonHref(todayDay)}
                style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(124,58,237,0.40)', marginBottom: 10 }}>
                Začít učení →
              </Link>
              <button onClick={() => markComplete(todayDay.dayNumber)}
                style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                ✓ Označit jako splněno
              </button>

              {todayDay.learningTip && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.18)', fontSize: 12, color: '#818cf8', lineHeight: 1.6 }}>
                  💡 {todayDay.learningTip}
                </div>
              )}
            </div>
          )}

          {/* WEEKLY SCHEDULE */}
          <div className="pub-au pub-au2" style={{ padding: '24px', background: BG2, border: `1px solid ${BD}`, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Týdenní přehled</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setWeekOffset(o => o - 1)} disabled={weekOffset <= -(Math.ceil(todayIdx / 7))} style={{ width: 28, height: 28, borderRadius: 8, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekStart + 7 >= allDays.length} style={{ width: 28, height: 28, borderRadius: 8, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {weekDays.map(d => (
                <div key={d.dayNumber}
                  onClick={() => { setActiveDay(d); setShowDrawer(true) }}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: d.isToday ? 'rgba(124,58,237,0.12)' : 'transparent', border: d.isToday ? '1px solid rgba(124,58,237,0.28)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ textAlign: 'center', width: 36, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: DIM, textTransform: 'uppercase' }}>{formatWeekDay(d.date)}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: d.isToday ? '#a78bfa' : MUT }}>{new Date(d.date).getDate()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: DIM }}>{d.estimatedMinutes} min · {d.phase}</div>
                  </div>
                  <div style={{ fontSize: 16, flexShrink: 0 }}>{d.todaysMood ?? '📚'}</div>
                </div>
              ))}
              {weekDays.length === 0 && <div style={{ fontSize: 13, color: DIM, textAlign: 'center', padding: '20px 0' }}>Žádné dny v tomto týdnu.</div>}
            </div>
          </div>
        </div>

        {/* PHASES OVERVIEW */}
        {plan.phases && plan.phases.length > 0 && (
          <div className="pub-au" style={{ marginTop: 20, padding: '24px', background: BG2, border: `1px solid ${BD}`, borderRadius: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Fáze plánu</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {plan.phases.map(phase => (
                <div key={phase.name} style={{ padding: '12px 14px', borderRadius: 12, background: `${phaseColor(phase.name)}10`, border: `1px solid ${phaseColor(phase.name)}25` }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{phase.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: phaseColor(phase.name) }}>{phase.name}</div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 2, lineHeight: 1.4 }}>{phase.tagline}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>Dny {phase.startDay}–{phase.endDay}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DAY DETAIL DRAWER */}
        {showDrawer && activeDay && (
          <>
            <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
            <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, maxWidth: '90vw', background: '#09071a', borderLeft: '1px solid rgba(124,58,237,0.25)', zIndex: 201, overflowY: 'auto', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Den {activeDay.dayNumber}</div>
                <button onClick={() => setShowDrawer(false)} style={{ background: 'transparent', border: 'none', color: MUT, fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 8, lineHeight: 1.3 }}>{activeDay.title}</h2>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 100, background: `${phaseColor(activeDay.phase)}15`, fontSize: 11, fontWeight: 700, color: phaseColor(activeDay.phase) }}>{activeDay.phase}</span>
                <span style={{ padding: '4px 10px', borderRadius: 100, background: BG2, border: `1px solid ${BD}`, fontSize: 11, color: MUT }}>⏱ {activeDay.estimatedMinutes} min</span>
                <span style={{ padding: '4px 10px', borderRadius: 100, background: BG2, border: `1px solid ${BD}`, fontSize: 11, color: MUT }}>{formatDate(activeDay.date, true)}</span>
              </div>
              <p style={{ fontSize: 14, color: MUT, lineHeight: 1.7, marginBottom: 20 }}>{activeDay.mainTask}</p>

              {activeDay.specificSteps && activeDay.specificSteps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 10 }}>KONKRÉTNÍ KROKY</div>
                  {activeDay.specificSteps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: MUT, lineHeight: 1.65 }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeDay.interestingFact && (
                <div style={{ padding: '12px 14px', background: 'rgba(124,58,237,0.08)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.20)', fontSize: 13, color: '#c4b5fd', lineHeight: 1.65, marginBottom: 12 }}>
                  🌟 {activeDay.interestingFact}
                </div>
              )}

              {activeDay.learningTip && (
                <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.20)', fontSize: 13, color: '#818cf8', lineHeight: 1.65, marginBottom: 12 }}>
                  💡 {activeDay.learningTip}
                </div>
              )}

              {/* Drawer CTA: open the lesson view for this specific day */}
              <Link href={lessonHref(activeDay)}
                style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: 8, boxShadow: '0 4px 16px rgba(124,58,237,0.40)' }}>
                Začít učení →
              </Link>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  )
}
