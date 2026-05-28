'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'
const BD   = 'rgba(255,255,255,0.08)'
const BG2  = 'rgba(255,255,255,0.03)'

const SUBJECT_CHIPS = ['Matematika', 'Biologie', 'Chemie', 'Fyzika', 'Dějepis', 'Zeměpis', 'Čeština', 'Angličtina', 'Programování', 'Ekonomie']

const LOADING_MSGS = ['Skládám to dohromady…', 'Rozkládám kapitoly…', 'Připravuji denní úkoly…', 'Hotovo 🎯']

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = Math.round((new Date(dateStr).getTime() - today.getTime()) / 86400000)
  return d > 0 ? d : null
}

function getTodayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()+1).padStart(2,'0')}`
}

export default function NovyPlanPage() {
  const router = useRouter()
  const [step, setStep]       = useState(1)
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')
  const [dailyMins, setDailyMins] = useState(45)
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [msgIdx, setMsgIdx]   = useState(0)
  const [error, setError]     = useState('')

  const dl = daysUntil(examDate)
  const progress = (step / 4) * 100

  const next = () => setStep(s => Math.min(s + 1, 4))
  const back = () => setStep(s => Math.max(s - 1, 1))

  const generate = async () => {
    setLoading(true)
    setError('')
    setMsgIdx(0)

    const msgInterval = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1400)

    try {
      const intensity = dailyMins <= 30 ? 'every-other' : dailyMins >= 90 ? 'daily' : 'daily'
      const res = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          examDate,
          schoolType: 'SŠ',
          grade: '3',
          readiness: 70,
          intensity,
          language: 'cs',
          userNotes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'no_credits') {
          window.dispatchEvent(new CustomEvent('upgrade-modal-open'))
          return
        }
        throw new Error(d.error || 'Generování selhalo')
      }

      const data = await res.json()

      const id = `plan_${Date.now()}`
      const plan = {
        id,
        subject,
        examDate,
        dailyMinutes: dailyMins,
        createdAt: new Date().toISOString(),
        totalSessions: data.totalSessions ?? data.days?.length ?? 0,
        completedSessions: 0,
        motivation: data.motivation,
        phases: data.phases,
        days: data.days,
      }

      // Save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('teachio:plans:v1') ?? '[]')
        existing.unshift(plan)
        localStorage.setItem('teachio:plans:v1', JSON.stringify(existing))
        // Also save full plan data separately
        localStorage.setItem(`teachio:plan:${id}`, JSON.stringify(plan))
      } catch {}

      router.push(`/studijni-plan/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
      setLoading(false)
    } finally {
      clearInterval(msgInterval)
    }
  }

  return (
    <PublicShell compact>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px 100px' }}>

        {/* Back link */}
        <Link href="/studijni-plan" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13, color: DIM, textDecoration: 'none', marginBottom: 32 }}>
          ← Moje plány
        </Link>

        {/* Progress bar */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Krok {step} ze 4</span>
            <span style={{ fontSize: 12, color: DIM }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 24px', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>📅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{LOADING_MSGS[msgIdx]}</div>
            <div style={{ fontSize: 14, color: MUT, marginBottom: 24 }}>Sestavuji plán pro {subject}</div>
            <div style={{ width: '100%', height: 3, background: BG2, borderRadius: 2 }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)', borderRadius: 2, animation: 'pub-fadeUp 1.6s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Step 1: Subject */}
            {step === 1 && (
              <div className="pub-au">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Předmět / téma</div>
                <h1 style={{ ...serif, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, marginBottom: 32 }}>Z čeho se učíš?</h1>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Napiš předmět nebo téma…"
                  autoFocus
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 14, background: BG2, border: `1px solid ${BD}`, color: TEXT, fontSize: 16, outline: 'none', transition: 'border-color 0.15s', marginBottom: 16, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.50)'}
                  onBlur={e => e.target.style.borderColor = BD}
                  onKeyDown={e => { if (e.key === 'Enter' && subject.trim()) next() }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUBJECT_CHIPS.map(chip => (
                    <button key={chip} onClick={() => setSubject(chip)}
                      style={{ padding: '6px 14px', borderRadius: 100, background: subject === chip ? 'rgba(124,58,237,0.25)' : BG2, border: `1px solid ${subject === chip ? 'rgba(124,58,237,0.50)' : BD}`, color: subject === chip ? '#c4b5fd' : MUT, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date */}
            {step === 2 && (
              <div className="pub-au">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Termín zkoušky</div>
                <h1 style={{ ...serif, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, marginBottom: 8 }}>Kdy to praskne?</h1>
                <p style={{ fontSize: 15, color: MUT, marginBottom: 28 }}>Zadej datum — Teachio spočítá, kolik máš dní.</p>
                <input
                  type="date"
                  value={examDate}
                  min={getTodayIso()}
                  onChange={e => setExamDate(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 14, background: BG2, border: `1px solid ${BD}`, color: TEXT, fontSize: 16, outline: 'none', transition: 'border-color 0.15s', marginBottom: 16, boxSizing: 'border-box', colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.50)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
                {dl !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(124,58,237,0.10)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.22)' }}>
                    <span style={{ fontSize: 18 }}>💪</span>
                    <span style={{ fontSize: 14, color: '#c4b5fd', fontWeight: 600 }}>Zbývá {dl} dní — to zvládneme!</span>
                  </div>
                )}
                {examDate && dl === null && (
                  <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.08)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.20)', fontSize: 13, color: '#fca5a5' }}>
                    Termín musí být v budoucnosti.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Daily time */}
            {step === 3 && (
              <div className="pub-au">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Denní čas</div>
                <h1 style={{ ...serif, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, marginBottom: 8 }}>Kolik máš čas denně?</h1>
                <p style={{ fontSize: 15, color: MUT, marginBottom: 32 }}>Teachio přizpůsobí plán tvému tempu.</p>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: MUT }}>15 min</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa' }}>{dailyMins} min</span>
                    <span style={{ fontSize: 13, color: MUT }}>4 h</span>
                  </div>
                  <input
                    type="range"
                    min={15} max={240} step={15}
                    value={dailyMins}
                    onChange={e => setDailyMins(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                </div>
                {dl && (
                  <div style={{ padding: '14px 18px', background: BG2, border: `1px solid ${BD}`, borderRadius: 12 }}>
                    <div style={{ fontSize: 14, color: MUT }}>
                      Celkem ti to dá přibližně{' '}
                      <span style={{ fontWeight: 700, color: TEXT }}>{Math.round(dl * dailyMins / 60)} h</span>
                      {' '}učení.{' '}
                      <span style={{ color: '#34d399' }}>{dailyMins <= 60 ? 'Akorát.' : dailyMins <= 90 ? 'Solidní.' : 'Machr! 💪'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Materials */}
            {step === 4 && (
              <div className="pub-au">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Materiály (volitelné)</div>
                <h1 style={{ ...serif, fontSize: 'clamp(26px,5vw,38px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, marginBottom: 8 }}>Máš zápisky?</h1>
                <p style={{ fontSize: 15, color: MUT, marginBottom: 24 }}>Přidej kontext — plán bude přesnější. Nebo přeskoč.</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Vlož témata, osnovu, zápisky nebo jakýkoli kontext…"
                  rows={6}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 14, background: BG2, border: `1px solid ${BD}`, color: TEXT, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.65, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.50)'}
                  onBlur={e => e.target.style.borderColor = BD}
                />
                {error && (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
              {step > 1 ? (
                <button onClick={back} style={{ padding: '12px 24px', borderRadius: 12, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ← Zpět
                </button>
              ) : (
                <Link href="/studijni-plan" style={{ padding: '12px 24px', borderRadius: 12, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Zrušit
                </Link>
              )}

              {step < 4 ? (
                <button
                  onClick={next}
                  disabled={
                    (step === 1 && !subject.trim()) ||
                    (step === 2 && (!examDate || !dl))
                  }
                  style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.40)', opacity: (step === 1 && !subject.trim()) || (step === 2 && (!examDate || !dl)) ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                  Pokračovat →
                </button>
              ) : (
                <button
                  onClick={generate}
                  style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.50)' }}>
                  ✨ Vytvořit plán
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </PublicShell>
  )
}
