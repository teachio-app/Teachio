'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, BookOpen, Trophy, FileText, Brain, BarChart2 } from 'lucide-react'

// ── Types (mirrors ExamCalendar) ──────────────────────────────────────────────

type Phase       = 'intro' | 'deepen' | 'practice' | 'review' | 'final'
type SchoolLevel = 'ZŠ' | 'SŠ' | 'VŠ'
type Material    = 'PDF' | 'Screenshot' | 'Text'
type Language    = 'cs' | 'en' | 'de'
type SourceStrat = 'only-mine' | 'augmented' | 'teachio-only'
type Intensity   = 'daily' | 'every-other' | 'weekends'
type GameType    = 'Quiz' | 'Flashcards' | 'Matching'

interface StudyDay {
  date:      string
  phase:     Phase
  phaseName: string
  task:      string
  modules:   { notes: string; trivia: string; hasPodcast: boolean; gameType: GameType }
}

interface ExamPlan {
  topic: string; examDate: string; schoolLevel: SchoolLevel; grade: string
  schoolName: string; mastery: number; materials: Material[]; language: Language
  sourceStrat: SourceStrat; intensity: Intensity
  studyDays: StudyDay[]; completedDates: string[]; createdDate: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'teachio_exam_plan_v4'
const DAY_CZ = ['Ne','Po','Út','St','Čt','Pá','So']
const MONTH_CZ = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince']

function fromISO(s: string) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
function dayDiff(a: Date, b: Date) { return Math.round((b.getTime()-a.getTime())/86_400_000) }
function toISO(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function fmtDate(iso: string) {
  const d = fromISO(iso)
  return `${d.getDate()}. ${MONTH_CZ[d.getMonth()]} ${d.getFullYear()}`
}

const PHASE_COLOR: Record<Phase, string> = {
  intro: '#60a5fa', deepen: '#a78bfa', practice: '#34d399', review: '#fbbf24', final: '#f87171',
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = 'plan' | 'materials' | 'quiz' | 'flashcards' | 'notes' | 'stats'

const TABS: Array<{ id: Tab; icon: React.ReactNode; label: string }> = [
  { id: 'plan',       icon: <Calendar className="w-3.5 h-3.5" />,   label: 'Plán' },
  { id: 'materials',  icon: <FileText className="w-3.5 h-3.5" />,   label: 'Materiály' },
  { id: 'quiz',       icon: <Brain className="w-3.5 h-3.5" />,      label: 'Kvízy' },
  { id: 'flashcards', icon: <BookOpen className="w-3.5 h-3.5" />,   label: 'Kartičky' },
  { id: 'notes',      icon: <FileText className="w-3.5 h-3.5" />,   label: 'Poznámky' },
  { id: 'stats',      icon: <BarChart2 className="w-3.5 h-3.5" />,  label: 'Statistiky' },
]

// ── Mini calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ plan, todayISO, onToggle }: { plan: ExamPlan; todayISO: string; onToggle: (iso: string) => void }) {
  const [offset, setOffset] = useState(0)
  const week = useMemo(() => plan.studyDays.slice(offset * 7, offset * 7 + 7), [plan, offset])
  const maxOffset = Math.max(0, Math.ceil(plan.studyDays.length / 7) - 1)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-bold" style={{ color:'#a78bfa' }}>📅 Týdenní plán</p>
        <div className="flex gap-1">
          <button onClick={()=>setOffset(o=>Math.max(0,o-1))} disabled={offset===0}
            className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-white/5 transition-colors text-xs" style={{ color:'#64748b' }}>‹</button>
          <button onClick={()=>setOffset(o=>Math.min(maxOffset,o+1))} disabled={offset===maxOffset}
            className="w-6 h-6 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-white/5 transition-colors text-xs" style={{ color:'#64748b' }}>›</button>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {week.length === 0 && (
          <p className="text-xs text-center py-3" style={{ color:'#334155' }}>Žádné studijní dny</p>
        )}
        {week.map(day => {
          const done = plan.completedDates.includes(day.date)
          const isToday = day.date === todayISO
          const d = fromISO(day.date)
          return (
            <button key={day.date} onClick={()=>onToggle(day.date)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all hover:opacity-80"
              style={{
                background: done ? 'rgba(74,222,128,0.08)' : isToday ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${done?'rgba(74,222,128,0.25)':isToday?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.05)'}`,
              }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: done?'rgba(74,222,128,0.20)':'rgba(255,255,255,0.06)', border:`1px solid ${done?'rgba(74,222,128,0.40)':'rgba(255,255,255,0.10)'}` }}>
                {done && <span className="text-xs" style={{ color:'#4ade80' }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: done?'#4ade80':isToday?'#a78bfa':'#94a3b8' }}>
                  {DAY_CZ[d.getDay()]} {d.getDate()}.{d.getMonth()+1}
                </p>
                <p className="text-xs truncate" style={{ color:'#475569' }}>{day.task}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background:`${PHASE_COLOR[day.phase]}18`, color:PHASE_COLOR[day.phase] }}>
                {day.phaseName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const router = useRouter()
  const [plan,    setPlan]    = useState<ExamPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('plan')
  const [notes,   setNotes]   = useState('')

  const todayISO = toISO(new Date())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPlan(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  function toggleDone(iso: string) {
    if (!plan) return
    const has = plan.completedDates.includes(iso)
    const updated = { ...plan, completedDates: has ? plan.completedDates.filter(d=>d!==iso) : [...plan.completedDates, iso] }
    setPlan(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
  }

  const daysLeft = plan ? dayDiff(new Date(), fromISO(plan.examDate)) : null
  const readiness = plan && plan.studyDays.length > 0
    ? Math.round((plan.completedDates.length / plan.studyDays.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.20)' }}>
          <Calendar className="w-8 h-8" style={{ color:'#a78bfa' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color:'#f1f5f9' }}>Žádný studijní plán</h2>
        <p className="text-sm" style={{ color:'#64748b' }}>Nejprve vytvoř studijní plán v Zkouškový kalendář.</p>
        <button onClick={()=>router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl"
          style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.25)' }}>
          <ArrowLeft className="w-4 h-4" />Zpět
        </button>
      </div>
    )
  }

  const completedCount = plan.completedDates.length
  const totalDays      = plan.studyDays.length
  const todayDay       = plan.studyDays.find(d=>d.date===todayISO)

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-3 flex-wrap">
        <button onClick={()=>router.back()}
          className="mt-1 flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
          style={{ color:'#475569' }}>
          <ArrowLeft className="w-4 h-4" />Zpět
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black truncate" style={{ color:'#f1f5f9' }}>{plan.topic}</h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.25)' }}>
              {plan.schoolLevel}{plan.grade ? ` · ${plan.grade}. roč.` : ''}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: daysLeft !== null && daysLeft <= 3 ? '#f87171' : '#64748b' }}>
              🗓️ {daysLeft !== null && daysLeft >= 0 ? `za ${daysLeft} dní` : 'zkouška proběhla'} · {fmtDate(plan.examDate)}
            </span>
            <span className="text-sm font-semibold" style={{ color: readiness >= 80 ? '#4ade80' : readiness >= 50 ? '#fbbf24' : '#94a3b8' }}>
              🎯 Připravenost {readiness}%
            </span>
            <span className="text-sm" style={{ color:'#475569' }}>
              ✓ {completedCount}/{totalDays} dní
            </span>
          </div>
        </div>

        {/* Readiness ring */}
        <div className="shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="28" cy="28" r="22" fill="none"
              stroke={readiness >= 80 ? '#4ade80' : readiness >= 50 ? '#fbbf24' : '#7c3aed'}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${(readiness / 100) * 138.2} 138.2`}
              transform="rotate(-90 28 28)" />
            <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="800" fill="#f1f5f9">{readiness}%</text>
          </svg>
        </div>
      </div>

      {/* ── Main layout: tabs + sticky right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT: tabs */}
        <div className="lg:col-span-8 space-y-5">

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                style={{
                  background: tab===t.id ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tab===t.id ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  color: tab===t.id ? '#a78bfa' : '#475569',
                }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-4 }} transition={{ duration:0.2 }}>

              {/* Plán */}
              {tab === 'plan' && (
                <div className="space-y-3">
                  {todayDay && (
                    <div className="rounded-2xl p-4 space-y-2"
                      style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.22)' }}>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#7c3aed' }}>Dnešní úkol</p>
                      <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>{todayDay.task}</p>
                      <p className="text-xs italic" style={{ color:'#64748b' }}>{todayDay.modules.notes}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {plan.studyDays.map(day => {
                      const done = plan.completedDates.includes(day.date)
                      const isToday = day.date === todayISO
                      const d = fromISO(day.date)
                      return (
                        <div key={day.date} className="flex items-start gap-3 p-3 rounded-xl transition-all"
                          style={{
                            background: done?'rgba(74,222,128,0.06)':isToday?'rgba(124,58,237,0.07)':'rgba(255,255,255,0.02)',
                            border:`1px solid ${done?'rgba(74,222,128,0.18)':isToday?'rgba(124,58,237,0.20)':'rgba(255,255,255,0.05)'}`,
                          }}>
                          <button onClick={()=>toggleDone(day.date)}
                            className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                            style={{ background:done?'rgba(74,222,128,0.20)':'rgba(255,255,255,0.06)', border:`1px solid ${done?'rgba(74,222,128,0.50)':'rgba(255,255,255,0.12)'}` }}>
                            {done && <span className="text-[10px]" style={{ color:'#4ade80' }}>✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold" style={{ color: done?'#4ade80':isToday?'#a78bfa':'#64748b' }}>
                                {DAY_CZ[d.getDay()]} {d.getDate()}.{d.getMonth()+1}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background:`${PHASE_COLOR[day.phase]}15`, color:PHASE_COLOR[day.phase] }}>
                                {day.phaseName}
                              </span>
                              {isToday && <span className="text-[10px] font-bold" style={{ color:'#a78bfa' }}>← dnes</span>}
                            </div>
                            <p className="text-sm mt-0.5" style={{ color: done?'#64748b':'#94a3b8', textDecoration:done?'line-through':'none' }}>{day.task}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Materiály */}
              {tab === 'materials' && (
                <div className="rounded-2xl p-5 space-y-4"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>Typ materiálů</p>
                      <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>
                        {plan.materials.length > 0 ? plan.materials.join(' · ') : 'Žádné (Teachio AI)'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>Zdroj dat</p>
                      <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>
                        {plan.sourceStrat==='only-mine'?'Pouze moje':plan.sourceStrat==='augmented'?'Moje + AI':'Teachio AI'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>Škola</p>
                      <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>{plan.schoolName || '–'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>Jazyk</p>
                      <p className="text-sm font-semibold" style={{ color:'#e2e8f0' }}>
                        {plan.language==='cs'?'🇨🇿 Čeština':plan.language==='en'?'🇬🇧 Angličtina':'🇩🇪 Němčina'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Kvízy */}
              {tab === 'quiz' && (
                <div className="rounded-2xl p-5 text-center space-y-4"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-4xl">🧩</span>
                  <div>
                    <p className="text-base font-bold" style={{ color:'#e2e8f0' }}>Kvízy pro {plan.topic}</p>
                    <p className="text-sm mt-1" style={{ color:'#475569' }}>Generuj výpisky k tématu a kvíz se vytvoří automaticky.</p>
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {tab === 'flashcards' && (
                <div className="rounded-2xl p-5 text-center space-y-4"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-4xl">🃏</span>
                  <div>
                    <p className="text-base font-bold" style={{ color:'#e2e8f0' }}>Flashkarty pro {plan.topic}</p>
                    <p className="text-sm mt-1" style={{ color:'#475569' }}>Flashkarty se vygenerují spolu s výpisky tématu.</p>
                  </div>
                </div>
              )}

              {/* Poznámky */}
              {tab === 'notes' && (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={e=>setNotes(e.target.value)}
                    placeholder="Zapiš si poznámky k této zkoušce…"
                    className="w-full rounded-2xl px-4 py-3 text-sm leading-relaxed resize-none outline-none"
                    style={{
                      minHeight:'240px', background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.08)', color:'#f1f5f9',
                    }}
                  />
                  <p className="text-xs" style={{ color:'#334155' }}>Poznámky jsou lokální a nesdílejí se.</p>
                </div>
              )}

              {/* Statistiky */}
              {tab === 'stats' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label:'Celkem dní',    val:totalDays,                 col:'#818cf8' },
                      { label:'Dokončeno',     val:completedCount,            col:'#4ade80' },
                      { label:'Zbývá dní',     val:Math.max(0,daysLeft??0),   col:'#fbbf24' },
                      { label:'Připravenost',  val:`${readiness}%`,           col:readiness>=80?'#4ade80':readiness>=50?'#fbbf24':'#f87171' },
                      { label:'Intenzita',     val:plan.intensity==='daily'?'Každý den':plan.intensity==='every-other'?'Ob den':'Víkendy', col:'#a78bfa' },
                      { label:'Zvládnutí',     val:`${plan.mastery}%`,        col:'#c084fc' },
                    ].map(s => (
                      <div key={s.label} className="rounded-2xl p-4 space-y-1"
                        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#475569' }}>{s.label}</p>
                        <p className="text-2xl font-black" style={{ color:s.col }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="rounded-2xl p-4 space-y-2"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex justify-between text-xs font-semibold" style={{ color:'#64748b' }}>
                      <span>Průběh studia</span><span>{readiness}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width:0 }} animate={{ width:`${readiness}%` }}
                        transition={{ duration:0.8, ease:'easeOut' }}
                        style={{ background:'linear-gradient(90deg,#6366f1,#a855f7)' }} />
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT: sticky mini-calendar */}
        <aside className="lg:col-span-4" style={{ position:'sticky', top:'72px', alignSelf:'start' }}>
          <MiniCalendar plan={plan} todayISO={todayISO} onToggle={toggleDone} />
        </aside>

      </div>
    </div>
  )
}
