'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, AlertTriangle, CheckCircle2, TrendingUp, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { FloatingChat } from '@/components/ui/FloatingChat'
import type { EssayGrade } from '@/types'

// ── Loading messages ───────────────────────────────────────────────────────────

const LOADING_MSGS = [
  'Čtu tvůj esej…',
  'Hledám silné stránky…',
  'Identifikuji oblasti ke zlepšení…',
  'Kontroluji gramatiku…',
  'Přepisuji esej do prémiové verze…',
  'Finalizuji hodnocení…',
]

// ── Grade colour coding ────────────────────────────────────────────────────────

function gradeStyle(grade: string) {
  const g = grade.charAt(0).toUpperCase()
  if (g === 'A') return { bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.35)', color: '#059669', shadow: 'rgba(5,150,105,0.25)' }
  if (g === 'B') return { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.35)', color: '#4f46e5', shadow: 'rgba(99,102,241,0.25)' }
  if (g === 'C') return { bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.35)', color: '#d97706', shadow: 'rgba(217,119,6,0.25)' }
  return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', color: '#dc2626', shadow: 'rgba(239,68,68,0.25)' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white/60 border-white/70 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Zkopírováno' : 'Kopírovat'}
    </button>
  )
}

function LoadingState({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-10 text-center space-y-6"
        style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(79,70,229,0.09)' }}>
        <div className="flex justify-center">
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <PenLine className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.p key={msg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
              className="text-slate-800 font-semibold text-lg">{msg}</motion.p>
          </AnimatePresence>
          <p className="text-slate-400 text-sm mt-1">Obvykle 10–15 sekund</p>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(79,70,229,0.08)' }}>
          <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.6, repeat: Infinity }}
            className="h-full w-1/3 rounded-full" style={{ background: 'linear-gradient(90deg,transparent,#6366f1,#7c3aed,transparent)' }} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GraderPage() {
  const { lang, t } = useLanguage()
  const [essay,   setEssay]   = useState('')
  const [topic,   setTopic]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<EssayGrade | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [msgIdx,  setMsgIdx]  = useState(0)
  const [showImproved, setShowImproved] = useState(false)

  useEffect(() => {
    if (!loading) { setMsgIdx(0); return }
    const id = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1800)
    return () => clearInterval(id)
  }, [loading])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (essay.trim().length < 50) return
    setLoading(true); setResult(null); setError(null); setShowImproved(false)
    try {
      const res = await fetch('/api/grade-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay, topic, targetLanguage: lang }),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'insufficient_credits') { window.dispatchEvent(new CustomEvent('upgrade-modal-open')); return }
        throw new Error(d.error)
      }
      window.dispatchEvent(new CustomEvent('credits-updated'))
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setLoading(false)
    }
  }

  const gs = result ? gradeStyle(result.grade) : null

  const docContext = result
    ? `ESSAY GRADING RESULT\n\nTopic: ${topic}\nGrade: ${result.grade} (${result.percentage}%)\n\nFeedback:\n${result.feedback}\n\nStrengths:\n${result.strengths.join('\n')}\n\nImprovements:\n${result.improvements.join('\n')}`
    : null

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="text-center space-y-6 pt-4 pb-2">
        <motion.div className="flex justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 20px 60px rgba(79,70,229,0.35),0 4px 16px rgba(0,0,0,0.12)' }}>
            <PenLine className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div className="space-y-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.grader.pageTitle}
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {t.grader.pageSubtitle}
          </p>
        </motion.div>

        <motion.div className="flex flex-wrap justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
          {[
            { label: 'Slovní hodnocení', sub: 'A+ až F s procentem' },
            { label: 'Silné stránky',    sub: 'konkrétní citace z textu' },
            { label: 'Gramatika',        sub: 'přesné chyby + opravy' },
            { label: 'Premium verze',    sub: 'profesionálně přepsaný esej' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 16px rgba(79,70,229,0.08)' }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }} />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.92)', boxShadow: '0 20px 48px rgba(79,70,229,0.10),0 4px 12px rgba(99,102,241,0.07),inset 0 1px 0 rgba(255,255,255,0.95)' }}>
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7,#7c3aed,#4f46e5)', backgroundSize: '200%' }} />
          <div className="p-8 sm:p-10">
            <form onSubmit={submit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Téma / Zadání eseje <span className="font-normal text-slate-400 normal-case">(volitelné)</span>
                </Label>
                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Např. Vliv průmyslové revoluce na společnost, Analýza Máchova díla…"
                  className="bg-white/70 border-white/60 focus:bg-white/90"
                  style={{ height: '52px', fontSize: '15px' }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="essay" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Text eseje
                  </Label>
                  <span className="text-xs font-mono" style={{ color: essay.length > 12000 ? '#d97706' : '#94a3b8' }}>
                    {essay.length.toLocaleString('cs')} znaků
                  </span>
                </div>
                <Textarea id="essay" value={essay} onChange={e => setEssay(e.target.value)}
                  placeholder="Vlož sem text svého eseje…&#10;&#10;Min. 50 znaků. Optimální délka: 300–3000 slov."
                  className="bg-white/70 border-white/60 focus:bg-white/90 resize-none"
                  style={{ minHeight: '260px', fontSize: '14px', lineHeight: '1.7' }} />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 text-sm text-red-700 bg-red-50/90 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}

              <button type="submit" disabled={loading || essay.trim().length < 50}
                className="w-full font-bold text-white rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: '56px', fontSize: '15px',
                  background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
                  boxShadow: (loading || essay.trim().length < 50) ? 'none' : '0 12px 40px rgba(79,70,229,0.35),0 4px 12px rgba(0,0,0,0.10)',
                }}>
                {loading ? '⏳ Hodnotím…' : '📝 Ohodnotit esej'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingState msg={LOADING_MSGS[msgIdx]} />}

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !loading && gs && (
          <motion.div key="results" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto space-y-4">

            {/* ── Grade hero ── */}
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
              <div className="rounded-3xl p-8 flex items-center gap-6"
                style={{ background: gs.bg, border: `2px solid ${gs.border}`, boxShadow: `0 16px 48px ${gs.shadow}` }}>
                <div className="shrink-0 flex flex-col items-center">
                  <span className="text-7xl font-black leading-none" style={{ color: gs.color }}>{result.grade}</span>
                  <span className="text-sm font-bold mt-1" style={{ color: gs.color }}>{result.percentage}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Celkové hodnocení</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{result.feedback.split('\n')[0]}</p>
                </div>
              </div>
            </motion.div>

            {/* ── Strengths ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(240,253,244,0.95)', border: '1.5px solid rgba(5,150,105,0.20)' }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(5,150,105,0.10)', background: 'rgba(5,150,105,0.05)' }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                  <p className="text-sm font-bold text-emerald-800">Silné stránky</p>
                </div>
                <ul className="p-4 space-y-2.5">
                  {result.strengths.map((s, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.06 }}
                      className="flex items-start gap-2.5 text-sm text-emerald-900 leading-relaxed">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* ── Improvements ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,251,235,0.95)', border: '1.5px solid rgba(217,119,6,0.20)' }}>
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(217,119,6,0.10)', background: 'rgba(217,119,6,0.05)' }}>
                  <TrendingUp className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
                  <p className="text-sm font-bold text-amber-800">Oblast ke zlepšení</p>
                </div>
                <ul className="p-4 space-y-2.5">
                  {result.improvements.map((imp, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.20 + i * 0.06 }}
                      className="flex items-start gap-2.5 text-sm text-amber-900 leading-relaxed">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                      {imp}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* ── Detailed feedback ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(99,102,241,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                  <p className="text-sm font-bold text-slate-800">📋 Podrobná zpětná vazba</p>
                  <CopyBtn text={result.feedback} />
                </div>
                <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.feedback}</p>
              </div>
            </motion.div>

            {/* ── Grammar issues ── */}
            {result.grammar_issues.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,241,242,0.95)', border: '1.5px solid rgba(239,68,68,0.18)' }}>
                  <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.10)', background: 'rgba(239,68,68,0.04)' }}>
                    <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                    <p className="text-sm font-bold text-red-800">Gramatické chyby ({result.grammar_issues.length})</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {result.grammar_issues.map((issue, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 + i * 0.05 }}
                        className="rounded-xl p-3.5 space-y-1.5"
                        style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-red-400 shrink-0 font-mono leading-relaxed line-through">„{issue.original}"</span>
                          <span className="text-slate-400 shrink-0">→</span>
                          <span className="text-emerald-700 font-mono leading-relaxed">„{issue.corrected}"</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{issue.explanation}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Improved version (collapsible) ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <div style={{ padding: '2px', borderRadius: '18px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)' }}>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(249,247,255,0.97)' }}>
                  <button onClick={() => setShowImproved(k => !k)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-violet-50/50"
                    style={{ borderBottom: showImproved ? '1px solid rgba(124,58,237,0.15)' : 'none' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <div>
                        <p className="text-sm font-bold text-violet-900">Premium verze eseje</p>
                        <p className="text-xs text-violet-600">Profesionálně přepsaná — zachovává tvé myšlenky</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {showImproved && <CopyBtn text={result.improved_version} />}
                      {showImproved
                        ? <ChevronUp className="w-4 h-4 text-violet-400" />
                        : <ChevronDown className="w-4 h-4 text-violet-400" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {showImproved && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                        <p className="px-5 py-5 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {result.improved_version}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Tutor chat ── */}
      <FloatingChat documentContext={docContext} />
    </div>
  )
}
