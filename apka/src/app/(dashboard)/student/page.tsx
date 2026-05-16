'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, AlertTriangle, Lightbulb,
  BookOpen, Copy, Check, Download, GraduationCap, Layers,
  BookMarked, FileText, UploadCloud, X as XIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InteractiveQuiz } from '@/components/student/InteractiveQuiz'
import { AudioPlayer } from '@/components/student/AudioPlayer'
import { PodcastPlayer } from '@/components/student/PodcastPlayer'
import { FlashcardGroup } from '@/components/student/FlashcardGroup'
import { InteractiveGame } from '@/components/student/InteractiveGame'
import { MermaidDiagram } from '@/components/student/MermaidDiagram'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { FloatingChat } from '@/components/ui/FloatingChat'
import type { SmartNotes, StudyLevel, ExamGoal } from '@/types'

// ── Document context builder ──────────────────────────────────────────────────

function buildStudentDocContext(notes: SmartNotes, topic: string, level: string): string {
  const parts: string[] = [`TOPIC: ${topic} | LEVEL: ${level}`]
  if (notes.introduction) parts.push('\nINTRODUCTION:\n' + notes.introduction)
  if (notes.tl_dr)        parts.push('\nTL;DR:\n' + notes.tl_dr)
  if (notes.deep_modules?.length) {
    parts.push('\nSTUDY MODULES:\n' +
      notes.deep_modules.map((m, i) =>
        `${i + 1}. ${m.title}\n${m.explanation}\nAnalogy: ${m.analogy}`
      ).join('\n\n'))
  }
  if (notes.exam_traps?.length) {
    parts.push('\nEXAM TRAPS:\n' + notes.exam_traps.join('\n'))
  }
  if (notes.memory_hack) parts.push('\nMEMORY HACK:\n' + notes.memory_hack)
  return parts.join('\n')
}

type InputMode = 'topic' | 'notes'

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDY_LEVELS: StudyLevel[] = ['ZŠ', 'SŠ', 'VŠ']

const LEVEL_META: Record<StudyLevel, { label: string; desc: string }> = {
  ZŠ: { label: 'ZŠ',          desc: '6.–9. třída' },
  SŠ: { label: 'SŠ / Matura', desc: 'Střední škola' },
  VŠ: { label: 'VŠ',          desc: 'Vysoká škola' },
}

interface ExamGoalOption {
  value: ExamGoal
  icon: string
  label: string
  desc: string
  accent: string   // text + border colour when selected
  bg: string       // background tint when selected
}

const EXAM_GOALS: ExamGoalOption[] = [
  {
    value: 'bezna-pisemka',
    icon: '📝',
    label: 'Běžná písemka / Test',
    desc: 'Standardní školní přezkoušení',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.07)',
  },
  {
    value: 'prijimaci-zkousky',
    icon: '🎯',
    label: 'Přijímačky na SŠ',
    desc: 'CERMAT styl, základy pod tlakem',
    accent: '#7c3aed',
    bg: 'rgba(124,58,237,0.07)',
  },
  {
    value: 'maturita',
    icon: '🎓',
    label: 'Maturita / Didakt. test',
    desc: 'Státní standardy, didaktické pasti',
    accent: '#db2777',
    bg: 'rgba(219,39,119,0.07)',
  },
  {
    value: 'statni-zaverecne',
    icon: '🏛',
    label: 'Státní zkoušky (VŠ)',
    desc: 'Akademická rigoróznost, teorie',
    accent: '#d97706',
    bg: 'rgba(217,119,6,0.07)',
  },
]

const EXAM_GOAL_LABELS: Record<ExamGoal, string> = {
  'bezna-pisemka':     '📝 Běžná písemka',
  'prijimaci-zkousky': '🎯 Přijímačky SŠ',
  'maturita':          '🎓 Maturita',
  'statni-zaverecne':  '🏛 Státní zkoušky (VŠ)',
}

// Which goals are valid for each study level — prevents illogical combinations
const GOAL_BY_LEVEL: Record<StudyLevel, ExamGoal[]> = {
  ZŠ: ['bezna-pisemka', 'prijimaci-zkousky'],
  SŠ: ['bezna-pisemka', 'maturita'],
  VŠ: ['bezna-pisemka', 'statni-zaverecne'],
}

// Dynamic labels/descriptions that change based on level context
function getGoalMeta(goal: ExamGoal, level: StudyLevel) {
  const base = EXAM_GOALS.find(g => g.value === goal)!
  if (goal === 'bezna-pisemka' && level === 'VŠ') {
    return { ...base, label: 'Běžná zkouška', desc: 'Standardní semestrální zkouška' }
  }
  return base
}

const LOADING_MESSAGES = [
  'Procházím studijní materiály…',
  'Identifikuji klíčové pojmy…',
  'Hledám chytáky pro zkoušku…',
  'Připravuji mnemotechniku…',
  'Finalizuji chytré výpisky…',
]

const BYON_LOADING_MESSAGES = [
  'Čtu tvoje zápisky…',
  'Identifikuji klíčové pojmy…',
  'Organizuji obsah do modulů…',
  'Tvořím kvíz z tvých zápisků…',
  'Finalizuji studijní přehled…',
]

// No hard front-end limit — backend handles large texts
const NOTES_SOFT_WARN = 50000   // show yellow counter above this, still allowed

const FACT_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#db2777,#f472b6)',
  'linear-gradient(135deg,#d97706,#fbbf24)',
  'linear-gradient(135deg,#059669,#34d399)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#4f46e5,#6366f1)',
]

// ── PDF export ────────────────────────────────────────────────────────────────

function buildPDFHTML(notes: SmartNotes, topic: string, level: string): string {
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8">
<title>Chytré výpisky: ${topic}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:740px;margin:0 auto;padding:32px;color:#1e293b;line-height:1.7}
  h1{font-size:26px;font-weight:800;margin-bottom:4px}
  .meta{color:#7c3aed;font-size:13px;font-weight:600;margin-bottom:24px}
  .tl-dr{background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:14px;padding:24px 28px;margin-bottom:20px}
  .tl-dr .label{color:#a5b4fc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
  .tl-dr p{color:#fff;font-size:18px;font-weight:700;line-height:1.6;margin:0}
  h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6366f1;margin:24px 0 8px}
  .fact{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;padding:10px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
  .num{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .fact p{font-size:14px;margin:0}
  .trap{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:14px;color:#92400e}
  .trap::before{content:"⚠ "}
  .hack{background:linear-gradient(135deg,#faf5ff,#f5f3ff);border:2px solid #c4b5fd;border-radius:10px;padding:16px 18px}
  .hack p{font-size:14px;color:#4c1d95;font-style:italic;margin:0}
  @media print{body{padding:16px}}
</style></head><body>
<h1>📚 ${topic}</h1>
<div class="meta">Chytré výpisky • ${level} • Teachio</div>
<div class="tl-dr"><div class="label">⚡ TL;DR — Esence za 10 sekund</div><p>${notes.tl_dr}</p></div>
<h2>📌 Klíčová fakta</h2>
${notes.core_topics
    ? notes.core_topics.map((t, i) => `<div class="fact"><div class="num">${i + 1}</div><div><strong>${t.title}</strong><p style="margin:4px 0 2px;white-space:pre-line">${t.deep_explanation}</p><em style="font-size:12px;color:#6366f1">📚 ${t.key_authors}</em></div></div>`).join('')
    : (notes.core_facts ?? []).map((f, i) => `<div class="fact"><div class="num">${i + 1}</div><p>${f}</p></div>`).join('')
  }
<h2>⚠ Chytáky pro zkoušku</h2>
${notes.exam_traps.map(t => `<div class="trap">${t}</div>`).join('')}
<h2>💡 Mnemotechnická pomůcka</h2>
<div class="hack"><p>${notes.memory_hack}</p></div>
<p style="color:#94a3b8;font-size:11px;margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0">Vygenerováno pomocí Teachio • teachio.app</p>
</body></html>`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyBtn({ onClick, label = 'Kopírovat' }: { onClick: () => void; label?: string }) {
  const [done, setDone] = useState(false)
  const handle = () => { onClick(); setDone(true); setTimeout(() => setDone(false), 2000) }
  return (
    <button onClick={handle}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        done
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-white/60 border-white/70 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/80'
      }`}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Zkopírováno' : label}
    </button>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-10 text-center space-y-6"
        style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(109,40,217,0.09)' }}>

        {/* Pulsing brain icon */}
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}
          >
            <Brain className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Cycling message */}
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.p key={message}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
              className="text-slate-800 font-semibold text-lg">
              {message}
            </motion.p>
          </AnimatePresence>
          <p className="text-slate-400 text-sm">Obvykle 3–6 sekund</p>
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(109,40,217,0.08)' }}>
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,#7c3aed,#a855f7,transparent)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const { lang, t } = useLanguage()
  const st = t.student        // shorthand
  const [inputMode, setInputMode] = useState<InputMode>('topic')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [isDragOver,     setIsDragOver]     = useState(false)
  const [showTextarea,   setShowTextarea]   = useState(false)
  const uploadParsing = uploadProgress !== null
  const [topic,     setTopic]     = useState('')
  const [rawNotes,  setRawNotes]  = useState('')
  const [level,     setLevel]     = useState<StudyLevel>('SŠ')
  const [examGoal,  setExamGoal]  = useState<ExamGoal>('bezna-pisemka')
  const [loading,   setLoading]   = useState(false)
  const [notes,     setNotes]     = useState<SmartNotes | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [msgIdx,    setMsgIdx]    = useState(0)

  useEffect(() => {
    if (!loading) { setMsgIdx(0); return }
    const msgs = inputMode === 'notes' ? BYON_LOADING_MESSAGES : LOADING_MESSAGES
    const id = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 1900)
    return () => clearInterval(id)
  }, [loading, inputMode])

  // Clear results when switching input mode
  useEffect(() => {
    setNotes(null)
    setError(null)
  }, [inputMode])

  // Auto-reset examGoal when level changes to prevent illogical combinations
  useEffect(() => {
    const available = GOAL_BY_LEVEL[level]
    if (!available.includes(examGoal)) {
      setExamGoal(available[0])
    }
  }, [level]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isBYON = inputMode === 'notes'
    if (isBYON && rawNotes.trim().length < 20) return
    if (!isBYON && !topic.trim()) return
    setLoading(true); setNotes(null); setError(null)
    try {
      const endpoint = isBYON ? '/api/generate-from-notes' : '/api/generate-notes'
      const payload  = isBYON
        ? { userNotes: rawNotes, level, examGoal, targetLanguage: lang }
        : { topic, level, examGoal, targetLanguage: lang }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'insufficient_credits') {
          window.dispatchEvent(new CustomEvent('upgrade-modal-open'))
          return
        }
        throw new Error(d.error)
      }
      window.dispatchEvent(new CustomEvent('credits-updated'))
      setNotes(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setLoading(false)
    }
  }

  const notesText = notes
    ? `CHYTRÉ VÝPISKY: ${topic.toUpperCase()} (${level} / ${EXAM_GOAL_LABELS[examGoal]})\n\n` +
      `TL;DR\n${notes.tl_dr}\n\n` +
      (notes.core_topics
        ? `KLÍČOVÉ AKADEMICKÉ KONCEPTY\n` +
          notes.core_topics.map((t, i) =>
            `${i + 1}. ${t.title}\n${t.deep_explanation}\nAutoři: ${t.key_authors}`
          ).join('\n\n')
        : `KLÍČOVÁ FAKTA\n` +
          (notes.core_facts ?? []).map((f, i) => `${i + 1}. ${f}`).join('\n')
      ) + `\n\n` +
      `CHYTÁKY PRO ZKOUŠKU\n${notes.exam_traps.join('\n')}\n\n` +
      `MNEMOTECHNICKÁ POMŮCKA\n${notes.memory_hack}`
    : ''

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return
    setUploadError(null)
    setUploadProgress({ current: 0, total: files.length })

    const parts: string[] = []
    let failed = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress({ current: i + 1, total: files.length })
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/parse-document', { method: 'POST', body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          console.warn(`[upload] ${file.name}:`, body.error)
          failed++; continue
        }
        const { text } = await res.json() as { text: string }
        parts.push(files.length > 1 ? `\n--- ${file.name} ---\n\n${text}` : text)
      } catch (err) {
        console.warn(`[upload] ${file.name}:`, err); failed++
      }
    }

    if (parts.length > 0) {
      const merged = parts.join('\n\n').trim()
      setRawNotes(prev => (prev.trim() ? prev.trim() + '\n\n' + merged : merged))
    }
    if (failed === files.length) setUploadError(st.upload.error)
    else if (failed > 0) setUploadError(`${files.length - failed}/${files.length} souborů úspěšně načteno.`)
    setUploadProgress(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    await processFiles(files)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    await processFiles(Array.from(e.dataTransfer.files))
  }

  const handlePDF = async () => {
    if (!notes) return
    const { downloadPdf } = await import('@/lib/downloadPdf')
    const label = inputMode === 'notes' ? 'vlastni-zapisky' : topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    await downloadPdf(buildPDFHTML(notes, inputMode === 'notes' ? 'Vlastní zápisky' : topic, LEVEL_META[level].label), `teachio-${label}.pdf`)
  }

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="text-center space-y-6 pt-4 pb-2">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%)',
              boxShadow: '0 20px 60px rgba(168,85,247,0.38),0 4px 16px rgba(0,0,0,0.12)',
            }}>
            <Brain className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Chytré výpisky
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {st.pageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Zap,           label: 'TL;DR za 10 s',    sub: 'absolutní esence' },
            { icon: AlertTriangle, label: 'Chytáky zkoušky',   sub: 'kde studenti chybují' },
            { icon: Lightbulb,     label: 'Mnemotechnika',     sub: 'zapamatuj si víc' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 16px rgba(168,85,247,0.08)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                <Icon className="w-3.5 h-3.5 text-violet-600" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1.5px solid rgba(255,255,255,0.92)',
            boxShadow: '0 20px 48px rgba(168,85,247,0.10),0 4px 12px rgba(109,40,217,0.07),inset 0 1px 0 rgba(255,255,255,0.95)',
          }}>
          {/* Gradient bar — violet/pink for student mode */}
          <div className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#a855f7,#6366f1)', backgroundSize: '200%' }} />

          <div className="p-8 sm:p-10">
            <form onSubmit={submit} className="space-y-6">

              {/* ── Input mode toggle ── */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {st.inputMode.label}
                </Label>
                <div
                  className="grid grid-cols-2 rounded-2xl p-1 gap-1"
                  style={{ background: 'rgba(109,40,217,0.07)', border: '1px solid rgba(255,255,255,0.6)' }}
                >
                  {([
                    { mode: 'topic' as InputMode, icon: BookMarked, label: st.inputMode.topic, desc: st.inputMode.topicDesc },
                    { mode: 'notes' as InputMode, icon: FileText,   label: st.inputMode.notes, desc: st.inputMode.notesDesc },
                  ] as const).map(({ mode, icon: Icon, label, desc }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setInputMode(mode)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        background: inputMode === mode
                          ? 'linear-gradient(135deg,#6366f1,#a855f7)'
                          : 'transparent',
                        boxShadow: inputMode === mode ? '0 4px 16px rgba(109,40,217,0.25)' : 'none',
                      }}
                    >
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: inputMode === mode ? 'rgba(255,255,255,0.9)' : '#7c3aed' }}
                        strokeWidth={2}
                      />
                      <div>
                        <p className="text-xs font-bold leading-none"
                          style={{ color: inputMode === mode ? '#fff' : '#374151' }}>
                          {label}
                        </p>
                        <p className="text-xs mt-0.5 leading-none"
                          style={{ color: inputMode === mode ? 'rgba(255,255,255,0.7)' : '#9ca3af' }}>
                          {desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Conditional input ── */}
              {inputMode === 'topic' ? (
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Téma ke studiu
                  </Label>
                  <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="Např. Fotosyntéza, Druhá světová válka, Newtonovy zákony…"
                    className="bg-white/70 border-white/60 focus:bg-white/90"
                    style={{ height: '52px', fontSize: '15px' }} />
                </div>
              ) : (
                /* ── BYON: Drop Zone (primary) + collapsible textarea ── */
                <div className="space-y-3">

                  {/* Drop Zone */}
                  <label
                    className="relative flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      borderColor: isDragOver ? '#6366f1' : uploadParsing ? '#a5b4fc' : rawNotes ? '#86efac' : 'rgba(124,58,237,0.30)',
                      background:  isDragOver ? 'rgba(99,102,241,0.07)' : uploadParsing ? 'rgba(167,139,250,0.05)' : rawNotes ? 'rgba(134,239,172,0.07)' : 'rgba(255,255,255,0.50)',
                    }}
                    onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
                    onDrop={handleDrop}
                  >
                    {uploadParsing && uploadProgress ? (
                      /* Uploading */
                      <div className="text-center space-y-2.5">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                          className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 mx-auto" />
                        <p className="text-sm font-semibold text-violet-700">
                          {uploadProgress.total > 1
                            ? `Načítám ${uploadProgress.current} / ${uploadProgress.total} souborů…`
                            : st.upload.parsing}
                        </p>
                      </div>
                    ) : rawNotes ? (
                      /* Loaded */
                      <div className="text-center space-y-1.5 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                          <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-bold text-emerald-800">Obsah načten</p>
                        <p className="text-xs text-slate-500">{rawNotes.length.toLocaleString('cs')} znaků</p>
                        <p className="text-xs text-slate-400">Přetáhni další soubory pro přidání</p>
                      </div>
                    ) : (
                      /* Empty */
                      <div className="text-center space-y-2.5 pointer-events-none">
                        <motion.div
                          animate={isDragOver ? { scale: 1.12 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                          style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}
                        >
                          <UploadCloud className="w-6 h-6 text-violet-500" strokeWidth={1.8} />
                        </motion.div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {isDragOver ? 'Pusť soubory!' : 'Přetáhni sem soubory nebo klikni'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">.pdf, .docx, .txt — více souborů najednou</p>
                        </div>
                      </div>
                    )}
                    <input type="file" multiple
                      accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only" onChange={handleFileUpload} disabled={uploadParsing} />
                  </label>

                  {/* Action row */}
                  <div className="flex items-center justify-between min-h-[24px]">
                    {rawNotes ? (
                      <div className="flex gap-3 items-center">
                        <button type="button" onClick={() => setShowTextarea(v => !v)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                          {showTextarea ? '▲ Skrýt editor' : '✏️ Upravit obsah'}
                        </button>
                        <button type="button" onClick={() => { setRawNotes(''); setShowTextarea(false) }}
                          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors">
                          <XIcon className="w-3 h-3" />Smazat
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowTextarea(v => !v)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors">
                        {showTextarea ? '▲ Skrýt' : 'Nebo vložit text ručně'}
                      </button>
                    )}
                  </div>

                  {/* Collapsible manual textarea */}
                  <AnimatePresence>
                    {showTextarea && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                        <Textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)}
                          placeholder={st.notesPlaceholder}
                          className="bg-white/70 border-white/60 focus:bg-white/90 resize-none font-mono text-sm leading-relaxed"
                          style={{ minHeight: '180px', fontSize: '13px' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {uploadError && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />{uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Study level — toggle pills */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Úroveň studia
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {STUDY_LEVELS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className="flex flex-col items-center gap-0.5 py-3 rounded-xl transition-all text-sm font-bold"
                      style={{
                        background: level === l
                          ? 'linear-gradient(135deg,#6366f1,#a855f7)'
                          : 'rgba(255,255,255,0.6)',
                        border: level === l
                          ? '1.5px solid rgba(99,102,241,0.3)'
                          : '1.5px solid rgba(255,255,255,0.75)',
                        color: level === l ? '#fff' : '#64748b',
                        boxShadow: level === l
                          ? '0 4px 16px rgba(109,40,217,0.25)'
                          : '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <span className="text-base">{l}</span>
                      <span className="text-xs font-medium opacity-80">{LEVEL_META[l].desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam goal selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Cíl přípravy
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_BY_LEVEL[level].map(goalValue => {
                    const goal = EXAM_GOALS.find(g => g.value === goalValue)!
                    const meta = getGoalMeta(goalValue, level)
                    const active = examGoal === goalValue
                    return (
                      <button
                        key={goalValue}
                        type="button"
                        onClick={() => setExamGoal(goalValue)}
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: active ? goal.bg : 'rgba(255,255,255,0.55)',
                          border: active
                            ? `1.5px solid ${goal.accent}40`
                            : '1.5px solid rgba(255,255,255,0.75)',
                          boxShadow: active
                            ? `0 4px 16px ${goal.accent}18`
                            : '0 2px 8px rgba(0,0,0,0.03)',
                        }}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{goal.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight"
                            style={{ color: active ? goal.accent : '#475569' }}>
                            {meta.label}
                          </p>
                          <p className="text-xs mt-0.5 leading-snug"
                            style={{ color: active ? goal.accent + 'cc' : '#94a3b8' }}>
                            {meta.desc}
                          </p>
                        </div>
                        {active && (
                          <span className="shrink-0 w-2 h-2 rounded-full ml-auto mt-1"
                            style={{ background: goal.accent }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 text-sm text-red-700 bg-red-50/90 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}

              {(() => {
                const isBYON = inputMode === 'notes'
                const disabled = loading ||
                  (isBYON ? rawNotes.trim().length < 20 : !topic.trim())
                return (
                  <button type="submit" disabled={disabled}
                    className="w-full font-bold text-white rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      height: '56px', fontSize: '15px', letterSpacing: '0.01em',
                      background: loading
                        ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                        : 'linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%)',
                      boxShadow: disabled ? 'none' : '0 12px 40px rgba(168,85,247,0.35),0 4px 12px rgba(0,0,0,0.10)',
                    }}>
                    {loading
                      ? st.generatingBtn
                      : isBYON ? st.processBtn : st.generateBtn}
                  </button>
                )
              })()}
            </form>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <LoadingState
          message={(inputMode === 'notes' ? BYON_LOADING_MESSAGES : LOADING_MESSAGES)[msgIdx]}
        />
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {notes && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto space-y-4">

            {/* Action bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {inputMode === 'notes'
                  ? <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                  : <GraduationCap className="w-4 h-4 text-violet-600 shrink-0" />
                }
                <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">
                  {inputMode === 'notes' ? '📝 Vlastní zápisky' : topic}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-violet-700 shrink-0"
                  style={{ background: 'rgba(124,58,237,0.1)' }}>{LEVEL_META[level].label}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#4f46e5' }}>
                  {EXAM_GOAL_LABELS[examGoal]}
                </span>
              </div>
              <div className="flex gap-2">
                <CopyBtn onClick={() => navigator.clipboard.writeText(notesText)} label="Kopírovat vše" />
                <button onClick={handlePDF}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/70 bg-white/60 text-slate-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/80 transition-all">
                  <Download className="w-3.5 h-3.5" />PDF
                </button>
              </div>
            </div>

            {/* ── Audio / Podcast player ── */}
            {(notes.podcast_script || notes.audio_script) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                {notes.podcast_script
                  ? <PodcastPlayer podcast_script={notes.podcast_script} />
                  : <AudioPlayer script={notes.audio_script!} />
                }
              </motion.div>
            )}

            {/* ── 0. Introduction — hook ── */}
            {notes.introduction && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
                <div className="rounded-2xl px-6 py-5 flex items-start gap-4"
                  style={{
                    background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.06))',
                    border: '1.5px solid rgba(99,102,241,0.18)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
                  }}>
                  <span className="text-2xl shrink-0 mt-0.5">✨</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Proč tě to zajímá</p>
                    <p className="text-base text-slate-800 leading-relaxed font-medium">{notes.introduction}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 1. TL;DR Hero ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div style={{
                background: 'linear-gradient(135deg,#1e1b4b 0%,#2d1f6e 50%,#4c1d95 100%)',
                borderRadius: '20px',
                padding: '28px 32px',
                boxShadow: '0 16px 48px rgba(79,46,220,0.28),0 4px 12px rgba(0,0,0,0.12)',
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-indigo-300" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                    TL;DR — Esence za 10 sekund
                  </span>
                </div>
                <p className="text-white text-xl sm:text-2xl font-bold leading-relaxed">
                  {notes.tl_dr}
                </p>
                <div className="mt-5 flex justify-end">
                  <CopyBtn onClick={() => navigator.clipboard.writeText(notes.tl_dr)} label="Kopírovat" />
                </div>
              </div>
            </motion.div>

            {/* ── 2. Deep Modules ── */}
            {notes.deep_modules && notes.deep_modules.length > 0 && (
              <div className="space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-2 px-1">
                  <Layers className="w-4 h-4 text-indigo-500" strokeWidth={2} />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Studijní moduly</span>
                  <span className="text-xs text-slate-400">({notes.deep_modules.length})</span>
                </div>

                {notes.deep_modules.map((mod, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.07 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.80)',
                      border: '1.5px solid rgba(255,255,255,0.90)',
                      boxShadow: '0 4px 20px rgba(109,40,217,0.07)',
                    }}
                  >
                    {/* Module header */}
                    <div
                      className="flex items-center gap-3 px-5 py-3.5"
                      style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.04)' }}
                    >
                      <span
                        className="shrink-0 w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center"
                        style={{ background: FACT_GRADIENTS[i % FACT_GRADIENTS.length] }}
                      >
                        {i + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                    </div>

                    {/* Explanation */}
                    <div className="px-5 pt-4 pb-3">
                      <p className="text-sm text-slate-700 leading-relaxed">{mod.explanation}</p>
                    </div>

                    {/* Analogy */}
                    <div
                      className="mx-4 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.14)' }}
                    >
                      <span className="text-base shrink-0 mt-0.5">🌍</span>
                      <p className="text-sm text-violet-800 italic leading-relaxed">{mod.analogy}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── 3. Exam Traps — warning styling ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,251,235,0.95)', border: '1.5px solid rgba(245,158,11,0.25)', boxShadow: '0 8px 28px rgba(245,158,11,0.10)' }}>
                {/* Header — warning-coloured */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                      <AlertTriangle className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">Pozor na chytáky!</p>
                      <p className="text-xs text-amber-700">Kde studenti nejčastěji chybují u zkoušky</p>
                    </div>
                  </div>
                  <CopyBtn onClick={() => navigator.clipboard.writeText(notes.exam_traps.join('\n'))} />
                </div>

                <div className="p-4 space-y-3">
                  {notes.exam_traps.map((trap, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.07 }}
                      className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(245,158,11,0.15)' }}>
                      <span className="shrink-0 text-lg mt-0.5">⚠️</span>
                      <p className="text-sm text-amber-950 leading-relaxed">{trap}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── 4. Memory Hack — gradient border, premium feel ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
              {/* Gradient border wrapper */}
              <div style={{ padding: '2px', borderRadius: '18px', background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(250,245,255,0.97)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                        <Lightbulb className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-violet-900">Mnemotechnická pomůcka</p>
                        <p className="text-xs text-violet-600">Trik pro zapamatování nejhůře uchopitelné části</p>
                      </div>
                    </div>
                    <CopyBtn onClick={() => navigator.clipboard.writeText(notes.memory_hack)} />
                  </div>

                  <div className="px-6 py-5">
                    <p className="text-base text-violet-900 leading-relaxed font-medium italic">
                      {notes.memory_hack}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── 5. Interactive Quiz ── */}
            {notes.interactive_quiz && notes.interactive_quiz.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: '1.5px solid rgba(255,255,255,0.92)',
                  boxShadow: '0 8px 32px rgba(109,40,217,0.09)',
                }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}
                >
                  <p className="text-sm font-bold text-slate-800">🧩 Otestuj se</p>
                  <p className="text-xs text-slate-400 mt-0.5">Klikni na odpověď — ihned uvidíš vysvětlení</p>
                </div>
                <div className="p-4">
                  <InteractiveQuiz questions={notes.interactive_quiz} />
                </div>
              </motion.div>
            )}

            {/* ── Flashcards ── */}
            {notes.flashcards && notes.flashcards.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.92)', boxShadow: '0 8px 32px rgba(109,40,217,0.09)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                  <p className="text-sm font-bold text-slate-800">{t.flashcards.tab}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.flashcards.clickToFlip}</p>
                </div>
                <div className="p-5">
                  <FlashcardGroup flashcards={notes.flashcards} />
                </div>
              </motion.div>
            )}

            {/* ── Mind Map ── */}
            {notes.mind_map_mermaid && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.50 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.92)', boxShadow: '0 8px 32px rgba(109,40,217,0.09)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                  <p className="text-sm font-bold text-slate-800">{t.teacher.tabs.mindMap}</p>
                </div>
                <div className="p-5">
                  <MermaidDiagram chart={notes.mind_map_mermaid} />
                </div>
              </motion.div>
            )}

            {/* ── Interactive Game ── */}
            {notes.interactive_game && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(255,255,255,0.92)', boxShadow: '0 8px 32px rgba(109,40,217,0.09)' }}>
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)', background: 'rgba(99,102,241,0.03)' }}>
                  <p className="text-sm font-bold text-slate-800">{t.game.tab}</p>
                </div>
                <div className="p-5">
                  <InteractiveGame game={notes.interactive_game} />
                </div>
              </motion.div>
            )}

            {/* Bottom copy-all action */}
            <div className="flex justify-center pt-2 pb-4">
              <div className="flex gap-3">
                <CopyBtn onClick={() => navigator.clipboard.writeText(notesText)} label={st.copyAll} />
                <button onClick={handlePDF}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.85)', color: '#64748b' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; e.currentTarget.style.color = '#db2777' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#64748b' }}>
                  <Download className="w-4 h-4" />{st.downloadPDF}
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Tutor chat ── */}
      <FloatingChat
        documentContext={notes
          ? buildStudentDocContext(notes, inputMode === 'notes' ? 'Vlastní zápisky' : topic, level)
          : null}
      />
    </div>
  )
}
