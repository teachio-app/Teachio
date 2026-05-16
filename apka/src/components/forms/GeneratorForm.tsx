'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// Tabs removed — results rendered as a scrollable feed
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RANDOM_TOPICS, type SubjectArea, type GradeCategory } from '@/lib/templates/generator'
import type { KlicovyPojem, Diferenciace, PracovniList, EURFramework, GenerationResult, WorksheetDraft } from '@/types'
import { InteractiveGame } from '@/components/student/InteractiveGame'
import { MermaidDiagram } from '@/components/student/MermaidDiagram'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { FloatingChat } from '@/components/ui/FloatingChat'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizItem { question: string; answer: string }
type Result = GenerationResult

// ── SVG sanitizer ─────────────────────────────────────────────────────────────

function sanitizeSvg(raw: string): string {
  if (!raw?.trim().startsWith('<svg')) return ''
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+(?:xlink:)?href\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<use[\s\S]*?>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRADE_OPTIONS = [
  { value: '1. třída ZŠ', label: '1. třída ZŠ (6–7 let)' }, { value: '2. třída ZŠ', label: '2. třída ZŠ (7–8 let)' },
  { value: '3. třída ZŠ', label: '3. třída ZŠ (8–9 let)' }, { value: '4. třída ZŠ', label: '4. třída ZŠ (9–10 let)' },
  { value: '5. třída ZŠ', label: '5. třída ZŠ (10–11 let)' }, { value: '6. třída ZŠ', label: '6. třída ZŠ (11–12 let)' },
  { value: '7. třída ZŠ', label: '7. třída ZŠ (12–13 let)' }, { value: '8. třída ZŠ', label: '8. třída ZŠ (13–14 let)' },
  { value: '9. třída ZŠ', label: '9. třída ZŠ (14–15 let)' }, { value: '1. ročník SŠ', label: '1. ročník SŠ (15–16 let)' },
  { value: '2. ročník SŠ', label: '2. ročník SŠ (16–17 let)' }, { value: '3. ročník SŠ', label: '3. ročník SŠ (17–18 let)' },
  { value: '4. ročník SŠ', label: '4. ročník SŠ / maturita (18–19 let)' },
]
const DURATION_OPTIONS = [
  { value: '45', label: '45 minut (standardní hodina)' },
  { value: '60', label: '60 minut' },
  { value: '90', label: '90 minut (blokové vyučování)' },
]
const SUBJECT_COLORS: Record<SubjectArea, { badge: string; dot: string }> = {
  history:    { badge: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-400' },
  math:       { badge: 'bg-blue-100 text-blue-800 border-blue-200',          dot: 'bg-blue-400' },
  physics:    { badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',          dot: 'bg-cyan-400' },
  biology:    { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-400' },
  chemistry:  { badge: 'bg-lime-100 text-lime-800 border-lime-200',          dot: 'bg-lime-400' },
  literature: { badge: 'bg-rose-100 text-rose-800 border-rose-200',          dot: 'bg-rose-400' },
  geography:  { badge: 'bg-teal-100 text-teal-800 border-teal-200',          dot: 'bg-teal-400' },
  civics:     { badge: 'bg-violet-100 text-violet-800 border-violet-200',    dot: 'bg-violet-400' },
  general:    { badge: 'bg-slate-100 text-slate-700 border-slate-200',       dot: 'bg-slate-400' },
}
const EUR_CFG = [
  { key: 'evocation' as keyof EURFramework,              accent: '#d97706', bg: 'rgba(217,119,6,0.06)',  border: 'rgba(217,119,6,0.18)',  icon: '⚡' },
  { key: 'realization_of_meaning' as keyof EURFramework, accent: '#4f46e5', bg: 'rgba(79,70,229,0.06)',  border: 'rgba(79,70,229,0.18)',  icon: '📖' },
  { key: 'reflection' as keyof EURFramework,             accent: '#059669', bg: 'rgba(5,150,105,0.06)',  border: 'rgba(5,150,105,0.18)',  icon: '✅' },
]
const QUIZ_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#818cf8)', 'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#db2777,#f472b6)', 'linear-gradient(135deg,#d97706,#fbbf24)',
  'linear-gradient(135deg,#059669,#34d399)',
]

// ── PDF export ─────────────────────────────────────────────────────────────────

function buildTeacherPDFHTML(result: Result, imageUrl: string | null, topic: string, grade: string, duration: string): string {
  const eur = result.eur_framework; const lp = result.lessonPlan
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>Teachio – ${topic}</title>
<style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:32px;color:#1e293b;line-height:1.7;font-size:14px}h1{font-size:24px;font-weight:800;margin:0 0 4px;color:#4f46e5}.meta{color:#64748b;font-size:12px;margin-bottom:6px}.badge{display:inline-block;padding:2px 10px;background:#e0e7ff;color:#4338ca;border-radius:999px;font-size:11px;font-weight:700;margin-bottom:20px}h2{font-size:14px;font-weight:700;margin:24px 0 8px;padding-bottom:5px;border-bottom:2px solid #e2e8f0}h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6366f1;margin:12px 0 3px}p{margin:0 0 8px}ul.obj{list-style:none;padding:0;margin:0 0 10px}ul.obj li{padding:3px 0 3px 18px;position:relative}ul.obj li::before{content:"✓";position:absolute;left:0;color:#6366f1;font-weight:700}.term{margin-bottom:5px}.term strong{color:#4338ca}.eur-phase{margin-bottom:12px;padding:12px 14px;border-radius:8px}.eur-evoc{background:#fffbeb;border-left:3px solid #d97706}.eur-real{background:#eef2ff;border-left:3px solid #4f46e5}.eur-refl{background:#ecfdf5;border-left:3px solid #059669}.quiz-item{margin-bottom:12px;padding:10px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}.q{font-weight:600;margin-bottom:4px}.a{color:#059669;font-size:13px}.ws{white-space:pre-wrap;font-family:'Courier New',monospace;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:12px;margin-bottom:10px}.svg-wrap{border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0;background:#fafafa;text-align:center}.svg-wrap svg{max-width:360px;height:auto}.match-table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}.match-table th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#6366f1;border-bottom:2px solid #e2e8f0;padding:4px 8px}.match-table td{padding:6px 8px;border-bottom:1px solid #f1f5f9}.match-table .blank{width:180px;border-bottom:1px solid #374151}.answer-key{font-size:10px;color:#94a3b8;margin:4px 0 16px;font-style:italic}.open-q{margin-bottom:16px}.q-num{font-weight:700;color:#4f46e5}.lines{border-bottom:1px solid #e2e8f0;margin-top:8px;height:48px}.creative{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-style:italic;color:#475569}.big-lines{border-bottom:1px solid #e2e8f0;margin-top:8px;height:80px}img{width:100%;border-radius:10px;margin-bottom:18px}.footer{color:#94a3b8;font-size:10px;margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0}
</style></head><body>
<h1>${topic}</h1><div class="meta">${result.subjectLabel} | ${grade} | ${duration} min${result.aiGenerated ? ' | GPT-4o-mini' : ''}</div>
<span class="badge">${result.subjectLabel}</span>
${imageUrl ? `<img src="${imageUrl}" alt="Ilustrace" />` : ''}
${result.cigleHodiny ? `<h2>🎯 Cíle hodiny</h2><ul class="obj">${result.cigleHodiny.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
${result.klicovePojmy ? `<h2>📚 Klíčové pojmy</h2>${result.klicovePojmy.map(p => `<div class="term"><strong>${p.term}</strong> — ${p.definition}</div>`).join('')}` : ''}
${eur ? `<h2>🏛 Plán hodiny (E-U-R)</h2><div class="eur-phase eur-evoc"><h3>⚡ Evokace</h3><p>${eur.evocation}</p></div><div class="eur-phase eur-real"><h3>📖 Uvědomění</h3><p>${eur.realization_of_meaning}</p></div><div class="eur-phase eur-refl"><h3>✅ Reflexe</h3><p>${eur.reflection}</p></div>` : ''}
${lp ? `<h2>📋 Plán hodiny</h2><h3>Úvod</h3><p>${lp.uvod}</p><h3>Aktivizace</h3><p>${lp.aktivizace}</p><h3>Hlavní část</h3><p>${lp.hlavniCast}</p><h3>Shrnutí</h3><p>${lp.shrnuti}</p>` : ''}
${result.group_activity ? `<h2>🎮 Skupinová aktivita</h2><div class="ws">${result.group_activity}</div>` : ''}
${result.sen_inclusion ? `<h2>💜 Inkluze SVP</h2><div class="ws">${result.sen_inclusion}</div>` : ''}
<h2>🧠 Opakovací kvíz</h2>${result.quiz.map((q, i) => `<div class="quiz-item"><div class="q">${i + 1}. ${q.question}</div><div class="a">💡 ${q.answer}</div></div>`).join('')}
${result.worksheet_draft && typeof result.worksheet_draft === 'object' ? `<h2>📄 ${result.worksheet_draft.title}</h2>${result.worksheet_draft.svg_illustration ? `<div class="svg-wrap">${sanitizeSvg(result.worksheet_draft.svg_illustration)}</div>` : ''}<table class="match-table"><tr><th>Pojem</th><th></th><th>Odpověď</th></tr>${result.worksheet_draft.matching_exercise.map(p => `<tr><td>${p.term}</td><td>→</td><td class="blank"></td></tr>`).join('')}</table><p class="answer-key">Klíč: ${result.worksheet_draft.matching_exercise.map((p, i) => `${i + 1}. ${p.match}`).join(' | ')}</p>${result.worksheet_draft.open_questions.map((q, i) => `<div class="open-q"><span class="q-num">${i + 1}.</span> ${q}<div class="lines"></div></div>`).join('')}<div class="creative">${result.worksheet_draft.creative_task}<div class="big-lines"></div></div>` : ''}
<p class="footer">Vygenerováno pomocí Teachio • teachio.app</p></body></html>`
}

async function handlePDFExport(result: Result, imageUrl: string | null, topic: string, grade: string, duration: string) {
  const { downloadPdf } = await import('@/lib/downloadPdf')
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  await downloadPdf(buildTeacherPDFHTML(result, imageUrl, topic, grade, duration), `teachio-${slug}.pdf`)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white/50 border-white/70 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/80'}`}>
      {copied ? '✓' : '⎘'} {label}
    </button>
  )
}

function AccordionAnswer({ answer, show, hide }: { answer: string; show: string; hide: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors">
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="inline-block text-sm">›</motion.span>
        {open ? hide : show}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <p className="mt-1.5 text-sm text-emerald-700 bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-2 leading-relaxed">💡 {answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-center gap-3 py-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <div>
          <p className="text-slate-800 font-semibold">{label}</p>
          <p className="text-slate-400 text-xs mt-0.5">Obvykle 8–12 sekund</p>
        </div>
      </div>
      <div className="rounded-3xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.65)', border: '1.5px solid rgba(255,255,255,0.85)', height: 320 }} />
    </motion.div>
  )
}

// ── Worksheet 2.0 View ─────────────────────────────────────────────────────────

function WorksheetView({ ws, t }: { ws: WorksheetDraft; t: any }) {
  const [showKey, setShowKey] = useState(false)
  const svgClean = sanitizeSvg(ws.svg_illustration)
  const wt = t.teacher.arsenal.ws

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{wt.title}</p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{ws.title}</h3>
        </div>
        <span className="text-xs text-slate-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />{wt.aiNote}</span>
      </div>

      {svgClean && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-2xl overflow-hidden flex items-center justify-center p-5"
          style={{ background: 'rgba(248,250,252,0.9)', border: '1.5px solid rgba(226,232,240,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="w-full max-w-sm" dangerouslySetInnerHTML={{ __html: svgClean }} />
        </motion.div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{wt.matching}</p>
        <p className="text-xs text-slate-400">{wt.matchingHint}</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="grid grid-cols-2 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider" style={{ background: 'rgba(99,102,241,0.05)', borderBottom: '1px solid rgba(99,102,241,0.10)' }}>
            <span>{wt.front ?? 'Pojem'}</span><span>{wt.back ?? 'Definice'}</span>
          </div>
          {ws.matching_exercise.map((pair, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04, duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-2 px-4 py-3 text-sm"
              style={{ borderBottom: i < ws.matching_exercise.length - 1 ? '1px solid rgba(226,232,240,0.7)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(248,250,252,0.5)' }}>
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-500 w-4">{i + 1}.</span>{pair.term}
              </span>
              <span className="text-slate-600">{pair.match}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">{wt.openQ}</p>
        {ws.open_questions.map((q, i) => (
          <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.13)' }}>
            <div className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', marginTop: '1px' }}>{i + 1}</span>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{q}</p>
            </div>
            <div className="ml-7 space-y-1.5 pt-1">{[1, 2, 3].map(n => <div key={n} className="h-px w-full" style={{ background: 'rgba(124,58,237,0.15)' }} />)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">{wt.creative}</p>
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.18)' }}>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{ws.creative_task}</p>
          <div className="space-y-2 pt-1">{[1, 2, 3, 4].map(n => <div key={n} className="h-px w-full" style={{ background: 'rgba(217,119,6,0.15)' }} />)}</div>
        </div>
      </div>

      <div>
        <button onClick={() => setShowKey(k => !k)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          style={{ background: showKey ? 'rgba(5,150,105,0.1)' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: showKey ? '#059669' : '#64748b' }}>
          {showKey ? wt.hideKey : wt.showKey}
        </button>
        <AnimatePresence>
          {showKey && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
              <div className="mt-3 rounded-xl p-4 space-y-2" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{wt.keyTitle}</p>
                {ws.matching_exercise.map((pair, i) => (
                  <p key={i} className="text-sm text-slate-700">
                    <span className="font-semibold text-emerald-700">{i + 1}. {pair.term}</span>
                    <span className="text-slate-400 mx-1.5">→</span>{pair.match}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Document context builder ───────────────────────────────────────────────────

function buildTeacherDocContext(result: Result, topic: string, grade: string): string {
  const parts: string[] = [`TOPIC: ${topic} | GRADE: ${grade} | SUBJECT: ${result.subjectLabel}`]
  if (result.cigleHodiny?.length) parts.push('\nOBJECTIVES:\n' + result.cigleHodiny.map((c, i) => `${i + 1}. ${c}`).join('\n'))
  if (result.klicovePojmy?.length) parts.push('\nVOCABULARY:\n' + result.klicovePojmy.map(p => `• ${p.term}: ${p.definition}`).join('\n'))
  if (result.eur_framework) { const e = result.eur_framework; parts.push(`\nLESSON (E-U-R):\nEvocation: ${e.evocation}\nRealization: ${e.realization_of_meaning}\nReflection: ${e.reflection}`) }
  if (result.quiz?.length) parts.push('\nQUIZ:\n' + result.quiz.map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}`).join('\n'))
  if (result.group_activity) parts.push('\nGROUP ACTIVITY:\n' + result.group_activity)
  if (result.sen_inclusion) parts.push('\nSEN:\n' + result.sen_inclusion)
  return parts.join('\n')
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GeneratorForm() {
  const { lang, t } = useLanguage()
  const tt = t.teacher  // shorthand for teacher translations

  const [topic,        setTopic]        = useState('')
  const [grade,        setGrade]        = useState(GRADE_OPTIONS[4].value)
  const [duration,     setDuration]     = useState(DURATION_OPTIONS[0].value)
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState<Result | null>(null)
  const [resultMeta,   setResultMeta]   = useState<{ topic: string; grade: string; duration: string } | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [imageUrl,     setImageUrl]     = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [showAnswerKey,setShowAnswerKey]= useState(false)

  useEffect(() => {
    if (!result?.aiGenerated || !resultMeta) return
    const controller = new AbortController()
    setImageLoading(true); setImageUrl(null)
    fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: resultMeta.topic, grade: resultMeta.grade }), signal: controller.signal })
      .then(r => r.ok ? r.json() : { imageUrl: null })
      .then(data => setImageUrl(data.imageUrl ?? null))
      .catch(() => {})
      .finally(() => setImageLoading(false))
    return () => controller.abort()
  }, [result])

  const randomTopic = () => { const all = Object.values(RANDOM_TOPICS).flat(); setTopic(all[Math.floor(Math.random() * all.length)]) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true); setResult(null); setError(null); setImageUrl(null); setResultMeta(null); setShowAnswerKey(false)
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, grade, duration, targetLanguage: lang }) })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'insufficient_credits') { window.dispatchEvent(new CustomEvent('upgrade-modal-open')); return }
        throw new Error(d.error)
      }
      window.dispatchEvent(new CustomEvent('credits-updated'))
      setResultMeta({ topic, grade, duration })
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const sc = result ? SUBJECT_COLORS[result.subject] : null
  const hasArsenal = !!(result?.eur_framework)

  const quizText = result
    ? result.quiz.map((q, i) => `${i + 1}. ${q.question}\n   ${q.answer}`).join('\n\n')
    : ''

  return (
    <div className="space-y-8">

      {/* ── Form ── */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px) saturate(1.5)', WebkitBackdropFilter: 'blur(10px) saturate(1.5)', border: '1.5px solid rgba(255,255,255,0.85)', boxShadow: '0 20px 48px rgba(109,40,217,0.11),0 4px 12px rgba(79,70,229,0.07),inset 0 1px 0 rgba(255,255,255,0.95)' }}>
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#a855f7,#6366f1)', backgroundSize: '200%' }} />
        <div className="p-8 sm:p-10">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-xs font-bold text-slate-500 uppercase tracking-widest">{tt.topicLabel}</Label>
              <div className="flex gap-3">
                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder={tt.topicPlaceholder} className="flex-1 bg-white/70 border-white/60 focus:bg-white/90" style={{ height: '52px', fontSize: '15px' }} />
                <button type="button" onClick={randomTopic} title={tt.randomTopic} className="px-4 rounded-xl text-xl transition-all hover:scale-105" style={{ height: '52px', background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 8px rgba(109,40,217,0.08)' }}>🎲</button>
              </div>
              <p className="text-xs text-slate-400 pl-1">{tt.topicHint}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { id: 'grade', label: tt.gradeLabel, value: grade, onChange: setGrade, options: GRADE_OPTIONS },
                { id: 'duration', label: tt.durationLabel, value: duration, onChange: setDuration, options: DURATION_OPTIONS },
              ].map(({ id, label, value, onChange, options }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</Label>
                  <select id={id} value={value} onChange={e => onChange(e.target.value)}
                    className="w-full rounded-xl border px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
                    style={{ height: '52px', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.75)', boxShadow: '0 2px 8px rgba(109,40,217,0.06)' }}>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 text-sm text-red-700 bg-red-50/80 border border-red-200 rounded-xl px-4 py-3">
                <span>⚠</span><span>{error}</span>
              </motion.div>
            )}

            <button type="submit" disabled={loading || !topic.trim()}
              className="w-full font-bold text-white rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ height: '56px', fontSize: '15px', letterSpacing: '0.01em', background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)', boxShadow: loading ? 'none' : '0 12px 40px rgba(109,40,217,0.35),0 4px 12px rgba(0,0,0,0.12)' }}>
              {loading ? tt.generatingBtn : tt.generateBtn}
            </button>
          </form>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingSkeleton label={tt.generatingBtn} />}

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="space-y-5">

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {sc && <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.badge}`}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{result.subjectLabel}</span>}
              <span className="text-xs font-medium text-slate-500 bg-white/60 border border-white/80 px-2.5 py-1 rounded-full">{result.gradeCategory === 'lower' ? '1.–3. třída' : result.gradeCategory === 'middle' ? '4.–6. třída' : '7. třída – SŠ'}</span>
              <span className="text-xs font-medium text-slate-500 bg-white/60 border border-white/80 px-2.5 py-1 rounded-full">{resultMeta?.duration} min</span>
              {result.aiGenerated
                ? <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{tt.aiGenerated}</span>
                : <span className="text-xs text-slate-400 bg-white/40 border border-white/60 px-2.5 py-1 rounded-full">{tt.template}</span>
              }
              {hasArsenal && <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{tt.arsenalBadge}</span>}
              <div className="ml-auto">
                <button onClick={() => void handlePDFExport(result, imageUrl, resultMeta?.topic ?? '', resultMeta?.grade ?? '', resultMeta?.duration ?? '')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/70 bg-white/50 text-slate-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/80 transition-all">
                  {tt.downloadPDF}
                </button>
              </div>
            </div>

            {/* DALL-E image */}
            {result.aiGenerated && (imageLoading || imageUrl) && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/7', minHeight: '220px' }}>
                {imageLoading
                  ? <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(221,214,254,0.7),rgba(224,231,255,0.7),rgba(252,231,243,0.7))' }}>
                      <div className="text-center space-y-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 rounded-full border-2 border-violet-300 border-t-violet-600 mx-auto" />
                        <p className="text-xs text-violet-500 font-medium">DALL-E 3…</p>
                      </div>
                    </div>
                  : imageUrl ? <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} src={imageUrl} alt={resultMeta?.topic} className="w-full h-full object-cover" /> : null}
              </div>
            )}

            {/* ── Scrollable Feed (no tabs) ── */}
            <div className="space-y-6">
              {/* ── 1. Objectives + Vocabulary ── */}
              {(result.cigleHodiny?.length || result.klicovePojmy?.length) && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                  <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tt.sections.objectives} · {tt.sections.vocabulary}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {result.cigleHodiny?.length && (
                      <ul className="space-y-2">
                        {result.cigleHodiny.map((cil, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>{i + 1}</span>
                            <p className="text-sm text-slate-700 leading-relaxed">{cil}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {result.klicovePojmy?.length && (
                      <div className="space-y-1.5">
                        {result.klicovePojmy.map((p, i) => (
                          <div key={i} className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                            <span className="font-bold text-indigo-800">{p.term}</span><span className="text-slate-500 mx-1.5">—</span><span className="text-slate-700">{p.definition}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* ── 2. Mind Map ── */}
              {result.mind_map_mermaid && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                  <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tt.tabs.mindMap}</p>
                  </div>
                  <div className="p-5"><MermaidDiagram chart={result.mind_map_mermaid} /></div>
                </motion.section>
              )}

              {/* ── 3. Lesson Plan (E-U-R or legacy) ── */}
              {(result.eur_framework || result.lessonPlan) && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{result.eur_framework ? tt.arsenal.eurTitle : tt.sections.lessonPlan}</p>
                  {result.eur_framework ? (
                    <div className="space-y-3">
                      {EUR_CFG.map((cfg, i) => (
                        <div key={cfg.key} className="rounded-2xl overflow-hidden" style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
                          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${cfg.border}` }}>
                            <span className="text-xl">{cfg.icon}</span>
                            <p className="text-sm font-bold" style={{ color: cfg.accent }}>{cfg.key === 'evocation' ? 'Evokace' : cfg.key === 'realization_of_meaning' ? 'Uvědomění si informací' : 'Reflexe'}</p>
                          </div>
                          <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.eur_framework![cfg.key]}</p>
                        </div>
                      ))}
                    </div>
                  ) : result.lessonPlan && (
                    <div className="space-y-2">
                      {([{ key: 'uvod', label: 'Úvod', icon: '🎯', accent: '#6366f1', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)' }, { key: 'aktivizace', label: 'Aktivizace', icon: '⚡', accent: '#d97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.15)' }, { key: 'hlavniCast', label: 'Hlavní část', icon: '📖', accent: '#7c3aed', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)' }, { key: 'shrnuti', label: 'Shrnutí', icon: '✅', accent: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.15)' }] as const).map(s => (
                        <div key={s.key} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${s.border}`, background: s.bg, borderLeft: `3px solid ${s.accent}` }}>
                          <div className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: s.accent }}><span>{s.icon}</span>{s.label}</div>
                          <p className="px-4 pb-4 text-sm text-slate-700 leading-relaxed">{result.lessonPlan![s.key]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.section>
              )}

              {/* ── 4. Quiz ── */}
              <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tt.tabs.quiz}</p>
                  <CopyButton text={quizText} label={tt.copy} />
                </div>
                <div className="p-5">
                  <ol className="space-y-3">
                    {result.quiz.map((item, i) => (
                      <li key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.4)' }}>
                        <div className="flex gap-3 px-4 py-3.5">
                          <span className="shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5" style={{ background: QUIZ_GRADIENTS[i % QUIZ_GRADIENTS.length] }}>{i + 1}</span>
                          <div className="space-y-2 flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{item.question}</p>
                            <AccordionAnswer answer={item.answer} show={tt.quiz.showAnswer} hide={tt.quiz.hideAnswer} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.section>

              {/* ── 5. Worksheet ── */}
              {result.worksheet_draft && typeof result.worksheet_draft === 'object' && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                  <WorksheetView ws={result.worksheet_draft} t={t} />
                </motion.section>
              )}
              {!hasArsenal && result.pracovniList && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                  <div className="p-6 space-y-5">
                    <div><h3 className="text-base font-bold text-slate-900">{result.pracovniList.nadpis}</h3><p className="text-sm text-slate-500 mt-1 italic">{result.pracovniList.instrukce}</p></div>
                    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.5)', border: '1.5px solid rgba(255,255,255,0.7)' }}>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '13.5px' }}>{result.pracovniList.obsah}</p>
                    </div>
                    <div>
                      <button onClick={() => setShowAnswerKey(k => !k)} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all" style={{ background: showAnswerKey ? 'rgba(5,150,105,0.1)' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: showAnswerKey ? '#059669' : '#64748b' }}>
                        {showAnswerKey ? tt.arsenal.legacyHideKey : tt.arsenal.legacyShowKey}
                      </button>
                      <AnimatePresence>
                        {showAnswerKey && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                            <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
                              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">{tt.arsenal.legacyKeyLabel}</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{result.pracovniList.klicOdpovedi}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── 6. Activity + SEN (side by side on wide screens) ── */}
              {(result.group_activity || result.sen_inclusion) && (
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="grid sm:grid-cols-2 gap-4">
                  {result.group_activity && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(124,58,237,0.05)', border: '1.5px solid rgba(124,58,237,0.18)' }}>
                      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(124,58,237,0.18)' }}>
                        <span className="text-xl">🎮</span>
                        <div><p className="text-sm font-bold text-violet-800">{tt.arsenal.groupActivity}</p><p className="text-xs text-violet-500">{tt.arsenal.groupActivitySub}</p></div>
                      </div>
                      <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.group_activity}</p>
                    </div>
                  )}
                  {result.sen_inclusion && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(219,39,119,0.05)', border: '1.5px solid rgba(219,39,119,0.18)' }}>
                      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(219,39,119,0.18)' }}>
                        <span className="text-xl">💜</span>
                        <div><p className="text-sm font-bold text-pink-800">{tt.arsenal.senTitle}</p><p className="text-xs text-pink-500">{tt.arsenal.senSub}</p></div>
                      </div>
                      <p className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.sen_inclusion}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── 7. Interactive Game ── */}
              {result.interactive_game && (
                <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.45, ease: 'easeOut' }} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}>
                  <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.game.tab}</p>
                  </div>
                  <div className="p-5"><InteractiveGame game={result.interactive_game} /></div>
                </motion.section>
              )}

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <FloatingChat
        documentContext={result ? buildTeacherDocContext(result, resultMeta?.topic ?? '', resultMeta?.grade ?? '') : null}
      />
    </div>
  )
}
