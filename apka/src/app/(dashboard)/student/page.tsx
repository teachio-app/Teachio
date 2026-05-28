'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ExamCalendar, type ExamCalendarHandle } from '@/components/student/ExamCalendar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, AlertTriangle, Lightbulb,
  Copy, Check, Download, Layers,
  FileText, UploadCloud, X as XIcon,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { SmartNotes, StudyLevel, ExamGoal } from '@/types'

// ── Lazy-loaded heavy components ──────────────────────────────────────────────
const InteractiveQuiz = dynamic(() => import('@/components/student/InteractiveQuiz').then(m => ({ default: m.InteractiveQuiz })), { ssr: false })
const AudioPlayer     = dynamic(() => import('@/components/student/AudioPlayer').then(m => ({ default: m.AudioPlayer })),     { ssr: false })
const PodcastPlayer   = dynamic(() => import('@/components/student/PodcastPlayer').then(m => ({ default: m.PodcastPlayer })), { ssr: false })
const FlashcardGroup  = dynamic(() => import('@/components/student/FlashcardGroup').then(m => ({ default: m.FlashcardGroup })), { ssr: false })
const InteractiveGame = dynamic(() => import('@/components/student/InteractiveGame').then(m => ({ default: m.InteractiveGame })), { ssr: false })
const MermaidDiagram  = dynamic(() => import('@/components/student/MermaidDiagram').then(m => ({ default: m.MermaidDiagram })), { ssr: false })
const FloatingChat    = dynamic(() => import('@/components/ui/FloatingChat').then(m => ({ default: m.FloatingChat })), { ssr: false })

// ── Doc context for AI chat ───────────────────────────────────────────────────
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
  if (notes.exam_traps?.length) parts.push('\nEXAM TRAPS:\n' + notes.exam_traps.join('\n'))
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
  value: ExamGoal; icon: string; label: string; desc: string; accent: string; bg: string
}

const EXAM_GOALS: ExamGoalOption[] = [
  { value: 'bezna-pisemka',     icon: '📝', label: 'Běžná písemka / Test',   desc: 'Standardní školní přezkoušení',    accent: '#6366f1', bg: 'rgba(99,102,241,0.07)' },
  { value: 'prijimaci-zkousky', icon: '🎯', label: 'Přijímačky na SŠ',       desc: 'CERMAT styl, základy pod tlakem',  accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)' },
  { value: 'maturita',          icon: '🎓', label: 'Maturita / Didakt. test', desc: 'Státní standardy, didaktické pasti', accent: '#db2777', bg: 'rgba(219,39,119,0.07)' },
  { value: 'statni-zaverecne',  icon: '🏛', label: 'Státní zkoušky (VŠ)',     desc: 'Akademická rigoróznost, teorie',   accent: '#d97706', bg: 'rgba(217,119,6,0.07)' },
]

const EXAM_GOAL_LABELS: Record<ExamGoal, string> = {
  'bezna-pisemka':     '📝 Běžná písemka',
  'prijimaci-zkousky': '🎯 Přijímačky SŠ',
  'maturita':          '🎓 Maturita',
  'statni-zaverecne':  '🏛 Státní zkoušky (VŠ)',
}

const GOAL_BY_LEVEL: Record<StudyLevel, ExamGoal[]> = {
  ZŠ: ['bezna-pisemka', 'prijimaci-zkousky'],
  SŠ: ['bezna-pisemka', 'maturita'],
  VŠ: ['bezna-pisemka', 'statni-zaverecne'],
}

function getGoalMeta(goal: ExamGoal, level: StudyLevel) {
  const base = EXAM_GOALS.find(g => g.value === goal)!
  if (goal === 'bezna-pisemka' && level === 'VŠ') return { ...base, label: 'Běžná zkouška', desc: 'Standardní semestrální zkouška' }
  return base
}

const LOADING_MESSAGES = [
  'Přemýšlím…',
  'Identifikuji klíčové pojmy…',
  'Skládám to dohromady…',
  'Skoro hotovo 🎯',
  'Finalizuji výpisky…',
]

const BYON_LOADING_MESSAGES = [
  'Čtu tvoje zápisky…',
  'Identifikuji klíčové pojmy…',
  'Skládám to dohromady…',
  'Skoro hotovo 🎯',
  'Finalizuji přehled…',
]

const TOPIC_PLACEHOLDERS = [
  'Fotosyntéza…',
  'Druhá světová válka…',
  'Newtonovy zákony…',
  'Cokoliv, fakt cokoliv.',
]

const NOTES_SOFT_WARN = 50000

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
        done ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white/60 border-white/70 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/80'
      }`}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Zkopírováno' : label}
    </button>
  )
}

interface FeatureCardProps {
  emoji: string; iconGradient: string; title: string; sub: string
  accentColor: string; onClick: () => void
}

function FeatureCard({ emoji, iconGradient, title, sub, accentColor, onClick }: FeatureCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    card.style.transform = `perspective(600px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateY(-2px)`
  }

  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = ''
    setHovered(false)
  }

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="text-left p-6 rounded-2xl w-full"
      style={{
        background: hovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
        border: hovered ? '1px solid rgba(255,255,255,0.13)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: iconGradient }}>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="text-base font-bold mb-1.5" style={{ color: '#f4f2ff', letterSpacing: '-0.01em' }}>{title}</p>
      <p className="text-sm leading-snug" style={{ color: '#7a7596' }}>{sub}</p>
      <div style={{
        marginTop: '12px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(5px)',
        transition: 'opacity 180ms ease, transform 180ms ease',
        fontSize: '12px', fontWeight: 600, color: accentColor,
      }}>
        Vyzkoušet demo →
      </div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const st = t.student

  const [inputMode,      setInputMode]      = useState<InputMode>('topic')
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

  const calendarRef = useRef<ExamCalendarHandle>(null)
  const [bentoModal,       setBentoModal]       = useState<'podcast' | 'quiz' | 'flashcards' | 'game' | null>(null)
  const [bentoFlipped,     setBentoFlipped]     = useState(false)
  const [bentoAudioPlaying,setBentoAudioPlaying]= useState(false)

  // New: rotating placeholder + exam strip info
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [examInfo, setExamInfo] = useState<{ subject?: string; daysLeft?: number; hasPlan?: boolean; planId?: string } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % TOPIC_PLACEHOLDERS.length), 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    try {
      // Check studijni-plan storage first (newest plans from the wizard)
      const plansRaw = localStorage.getItem('teachio:plans:v1')
      if (plansRaw) {
        const plans = JSON.parse(plansRaw) as Array<{ id: string; subject: string; examDate: string; totalSessions: number }>
        if (Array.isArray(plans) && plans.length > 0) {
          const latest = plans[0]
          if (latest?.examDate) {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const daysLeft = Math.round((new Date(latest.examDate).getTime() - today.getTime()) / 86400000)
            setExamInfo({ subject: latest.subject, daysLeft: daysLeft > 0 ? daysLeft : 0, hasPlan: (latest.totalSessions ?? 0) > 0, planId: latest.id })
            return
          }
        }
      }
      // Fall back to inline ExamCalendar storage
      const raw = localStorage.getItem('teachio_exam_plan_v4')
      if (raw) {
        const p = JSON.parse(raw)
        if (p?.examDate) {
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const daysLeft = Math.round((new Date(p.examDate).getTime() - today.getTime()) / 86400000)
          setExamInfo({ subject: p.topic ?? p.subject, daysLeft: daysLeft > 0 ? daysLeft : 0, hasPlan: Array.isArray(p.studyDays) && p.studyDays.length > 0 })
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!loading) { setMsgIdx(0); return }
    const msgs = inputMode === 'notes' ? BYON_LOADING_MESSAGES : LOADING_MESSAGES
    const id = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 1900)
    return () => clearInterval(id)
  }, [loading, inputMode])

  useEffect(() => { setNotes(null); setError(null) }, [inputMode])

  useEffect(() => {
    const available = GOAL_BY_LEVEL[level]
    if (!available.includes(examGoal)) setExamGoal(available[0])
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
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'insufficient_credits') { window.dispatchEvent(new CustomEvent('upgrade-modal-open')); return }
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
        ? `KLÍČOVÉ AKADEMICKÉ KONCEPTY\n` + notes.core_topics.map((t, i) => `${i + 1}. ${t.title}\n${t.deep_explanation}\nAutoři: ${t.key_authors}`).join('\n\n')
        : `KLÍČOVÁ FAKTA\n` + (notes.core_facts ?? []).map((f, i) => `${i + 1}. ${f}`).join('\n')
      ) + `\n\nCHYTÁKY PRO ZKOUŠKU\n${notes.exam_traps.join('\n')}\n\nMNEMOTECHNICKÁ POMŮCKA\n${notes.memory_hack}`
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
        const form = new FormData(); form.append('file', file)
        const res = await fetch('/api/parse-document', { method: 'POST', body: form })
        if (!res.ok) { failed++; continue }
        const { text } = await res.json() as { text: string }
        parts.push(files.length > 1 ? `\n--- ${file.name} ---\n\n${text}` : text)
      } catch { failed++ }
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="-mt-10 -mb-10 relative" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', minHeight: '100vh' }}>
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">

        {/* ── HERO ── */}
        <motion.section className="text-center space-y-4 pt-2" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          {/* Animated gradient orb */}
          <div className="relative flex justify-center h-24 items-center mb-2">
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, #7c3aed 30%, transparent 55%, #06b6d4 78%, transparent 100%)',
                opacity: 0.35,
              }}
            />
            <motion.div
              className="w-20 h-20 rounded-full relative z-10 flex items-center justify-center"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(circle at 38% 38%, #c084fc, #7c3aed 55%, #312e81)',
                boxShadow: '0 0 48px 12px rgba(124,58,237,0.38), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>
          </div>

          <h1
            className="font-black tracking-tight"
            style={{ fontSize: 'clamp(32px,6vw,44px)', lineHeight: 1.1, color: '#f4f2ff', letterSpacing: '-0.025em' }}
          >
            Co dnes{' '}
            <span style={{
              background: 'linear-gradient(135deg,#a855f7,#c084fc,#ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              zvládneme?
            </span>
          </h1>

          <p style={{ color: '#b9b3d6', fontSize: '16px', lineHeight: 1.5 }}>
            Napiš téma nebo hoď sem zápisky. Zbytek je na mně.
          </p>
        </motion.section>

        {/* ── INPUT CARD ── */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}>
        <form onSubmit={submit}>
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Tab pills inside card */}
            <div className="flex gap-1.5 p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {([
                { mode: 'topic' as InputMode, label: '✨ Téma' },
                { mode: 'notes' as InputMode, label: '📄 Soubor' },
              ] as const).map(({ mode, label }) => (
                <button
                  key={mode} type="button" onClick={() => setInputMode(mode)}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                  style={{
                    color: inputMode === mode ? '#f4f2ff' : '#7a7596',
                    background: inputMode === mode ? 'rgba(124,58,237,0.28)' : 'transparent',
                    boxShadow: inputMode === mode ? '0 0 0 1px rgba(124,58,237,0.35)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input body */}
            <div className="p-5 space-y-4">

              {inputMode === 'topic' ? (
                <textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder={TOPIC_PLACEHOLDERS[placeholderIdx]}
                  rows={2}
                  className="w-full bg-transparent border-0 outline-none resize-none font-medium"
                  style={{ color: '#f4f2ff', fontSize: '16px', lineHeight: 1.6, minHeight: '56px' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (topic.trim()) submit(e as unknown as React.FormEvent) } }}
                />
              ) : (
                <div className="space-y-3">
                  <label
                    className="relative flex flex-col items-center justify-center gap-3 py-7 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      borderColor: isDragOver ? '#7c3aed' : uploadParsing ? '#a78bfa' : rawNotes ? '#4ade80' : 'rgba(124,58,237,0.22)',
                      background: isDragOver ? 'rgba(124,58,237,0.08)' : rawNotes ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                    }}
                    onDragEnter={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false) }}
                    onDrop={handleDrop}
                  >
                    {uploadParsing && uploadProgress ? (
                      <div className="text-center space-y-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                          className="w-9 h-9 rounded-full border-2 mx-auto"
                          style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: '#a78bfa' }} />
                        <p className="text-sm font-semibold" style={{ color: '#a78bfa' }}>
                          {uploadProgress.total > 1 ? `Načítám ${uploadProgress.current}/${uploadProgress.total} souborů…` : 'Čtu dokument…'}
                        </p>
                      </div>
                    ) : rawNotes ? (
                      <div className="text-center space-y-1.5 pointer-events-none">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(74,222,128,0.15)' }}>
                          <Check className="w-5 h-5" style={{ color: '#4ade80' }} strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#4ade80' }}>Obsah načten ✓</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>{rawNotes.length.toLocaleString('cs')} znaků · Přetáhni další pro přidání</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 pointer-events-none">
                        <motion.div animate={isDragOver ? { scale: 1.15 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                          style={{ background: 'rgba(124,58,237,0.12)' }}>
                          <UploadCloud className="w-6 h-6" style={{ color: '#a78bfa' }} strokeWidth={1.8} />
                        </motion.div>
                        <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>
                          {isDragOver ? '🎯 Pusť soubory!' : 'Přetáhni PDF, DOCX, nebo TXT'}
                        </p>
                        <p className="text-xs" style={{ color: '#475569' }}>nebo klikni pro výběr · více souborů najednou</p>
                      </div>
                    )}
                    <input type="file" multiple
                      accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only" onChange={handleFileUpload} disabled={uploadParsing} />
                  </label>

                  <div className="flex items-center justify-between">
                    {rawNotes ? (
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowTextarea(v => !v)}
                          className="text-xs font-semibold transition-colors" style={{ color: '#7c3aed' }}>
                          {showTextarea ? '▲ Skrýt' : '✏️ Upravit text'}
                        </button>
                        <button type="button" onClick={() => { setRawNotes(''); setShowTextarea(false) }}
                          className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#475569' }}>
                          <XIcon className="w-3 h-3" />Smazat
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowTextarea(v => !v)}
                        className="text-xs underline underline-offset-2" style={{ color: '#475569' }}>
                        {showTextarea ? '▲ Skrýt' : 'Nebo vložit text ručně'}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showTextarea && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                        <textarea
                          value={rawNotes} onChange={e => setRawNotes(e.target.value)}
                          placeholder="Vlož zápisky, texty nebo studijní materiály…"
                          className="w-full rounded-2xl px-4 py-3 text-sm font-mono leading-relaxed resize-none outline-none border transition-colors"
                          style={{ minHeight: '160px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', fontSize: '13px' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {uploadError && (
                    <p className="text-xs flex items-center gap-1" style={{ color: '#fbbf24' }}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />{uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* Filter row: level + goal + submit */}
              <div className="flex flex-wrap items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Level chips */}
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {STUDY_LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setLevel(l)}
                      className="px-3 py-1.5 text-xs font-bold transition-all"
                      style={{ background: level === l ? 'rgba(124,58,237,0.30)' : 'transparent', color: level === l ? '#c4b5fd' : '#7a7596' }}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Goal chips */}
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {GOAL_BY_LEVEL[level].map(gv => {
                    const g = EXAM_GOALS.find(x => x.value === gv)!
                    return (
                      <button key={gv} type="button" onClick={() => setExamGoal(gv)}
                        className="px-3 py-1.5 text-xs font-bold transition-all"
                        style={{ background: examGoal === gv ? 'rgba(124,58,237,0.30)' : 'transparent', color: examGoal === gv ? '#c4b5fd' : '#7a7596' }}>
                        {g.icon} {getGoalMeta(gv, level).label.split(' ').slice(-1)[0]}
                      </button>
                    )
                  })}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (inputMode === 'notes' ? rawNotes.trim().length < 20 : !topic.trim())}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.42)',
                    transition: 'box-shadow 200ms ease',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                      Generuji…
                    </>
                  ) : (
                    <>✨ Vygenerovat</>
                  )}
                </button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 text-sm rounded-xl px-4 py-3"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}
            </div>
          </div>
        </form>
        </motion.div>

        {/* ── Idle sections (animated as a group) ── */}
        <AnimatePresence>
          {!notes && !loading && (
            <motion.div
              key="idle-content"
              className="space-y-6"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.22 } }}
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } } }}
            >
              {/* Quick actions */}
              <motion.div
                className="flex gap-3 justify-center"
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }}
              >
                <button type="button" onClick={() => calendarRef.current?.openModal()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
                  🗓️ Studijní plán
                </button>
                <button type="button" onClick={() => { setBentoModal('podcast'); setBentoAudioPlaying(false) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(219,39,119,0.08)', border: '1px solid rgba(219,39,119,0.20)', color: '#f472b6' }}>
                  🎧 Audio Tutor
                </button>
              </motion.div>

              {/* Exam strip */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }}
              >
                <button
                  onClick={() => {
                    if (examInfo?.planId) router.push(`/studijni-plan/${examInfo.planId}`)
                    else calendarRef.current?.openModal()
                  }}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.14)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <span className="text-xl">📅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {examInfo && examInfo.daysLeft !== undefined && examInfo.daysLeft > 0 ? (
                      <>
                        <p className="text-sm font-bold truncate" style={{ color: '#fbbf24' }}>
                          {examInfo.subject} · za {examInfo.daysLeft} dní
                        </p>
                        <p className="text-xs" style={{ color: '#78716c' }}>
                          {examInfo.hasPlan ? '✓ Plán sestaven · klikni pro přehled' : 'Klikni pro detaily'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>Blíží se zkouška?</p>
                        <p className="text-xs" style={{ color: '#78716c' }}>Nastav termín, sestavím plán.</p>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}>
                    {examInfo?.hasPlan ? 'Otevřít' : '+ Přidat'}
                  </span>
                </button>
              </motion.div>

              {/* Feature grid 2×2 */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
              >
                <FeatureCard
                  emoji="🎧" iconGradient="linear-gradient(135deg,#f97316,#fbbf24)"
                  title="Podcast" sub="Tvoje téma jako rozhlasová show."
                  accentColor="#f97316"
                  onClick={() => { setBentoModal('podcast'); setBentoAudioPlaying(false) }}
                />
                <FeatureCard
                  emoji="🧩" iconGradient="linear-gradient(135deg,#10b981,#14b8a6)"
                  title="Kvíz" sub="5 otázek. Hned. S vysvětlením."
                  accentColor="#10b981"
                  onClick={() => setBentoModal('quiz')}
                />
                <FeatureCard
                  emoji="📕" iconGradient="linear-gradient(135deg,#7c3aed,#6366f1)"
                  title="Kartičky" sub="Otoč. Zapamatuj. Hotovo."
                  accentColor="#a78bfa"
                  onClick={() => { setBentoModal('flashcards'); setBentoFlipped(false) }}
                />
                <FeatureCard
                  emoji="🕹️" iconGradient="linear-gradient(135deg,#f59e0b,#ec4899)"
                  title="Hra" sub="Spáruj a vyhraj."
                  accentColor="#f59e0b"
                  onClick={() => setBentoModal('game')}
                />
              </motion.div>

              {/* Streak strip */}
              <motion.div
                className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }}
              >
                <div className="flex items-center gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const isToday = i === 6
                    return (
                      <motion.div
                        key={i}
                        animate={isToday ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
                        transition={isToday ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                        className="rounded-full"
                        style={{
                          width: isToday ? '12px' : '10px',
                          height: isToday ? '12px' : '10px',
                          background: isToday
                            ? 'linear-gradient(135deg,#f97316,#ec4899)'
                            : 'rgba(255,255,255,0.10)',
                        }}
                      />
                    )
                  })}
                </div>
                <p className="text-xs font-semibold" style={{ color: '#7a7596' }}>
                  🔥 Udržuj sérii — tvůj mozek to ocení.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ExamCalendar — modal only, card hidden ── */}
        <ExamCalendar ref={calendarRef} hideCard />

        {/* ── Loading ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
            <div className="rounded-2xl p-10 text-center space-y-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.20)' }}>
              <div className="flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
                >
                  ✨
                </motion.div>
              </div>
              <div className="space-y-1">
                <AnimatePresence mode="wait">
                  <motion.p key={(inputMode === 'notes' ? BYON_LOADING_MESSAGES : LOADING_MESSAGES)[msgIdx]}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
                    className="font-semibold text-lg" style={{ color: '#f4f2ff' }}>
                    {(inputMode === 'notes' ? BYON_LOADING_MESSAGES : LOADING_MESSAGES)[msgIdx]}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm" style={{ color: '#7a7596' }}>Hotovo za chvilku.</p>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full w-1/3 rounded-full"
                  style={{ background: 'linear-gradient(90deg,transparent,#7c3aed,#a855f7,transparent)' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {notes && !loading && (
            <motion.div key="results" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4">

              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold truncate max-w-[180px]" style={{ color: '#a78bfa' }}>
                    {inputMode === 'notes' ? '📝 Zápisky' : topic}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{LEVEL_META[level].label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                    {EXAM_GOAL_LABELS[examGoal]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(notesText)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#64748b' }}>
                    <Copy className="w-3.5 h-3.5" />Kopírovat vše
                  </button>
                  <button onClick={handlePDF}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#64748b' }}>
                    <Download className="w-3.5 h-3.5" />PDF
                  </button>
                </div>
              </div>

              {/* Podcast / Audio */}
              {(notes.podcast_script || notes.audio_script) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {notes.podcast_script ? <PodcastPlayer podcast_script={notes.podcast_script} /> : <AudioPlayer script={notes.audio_script!} />}
                </motion.div>
              )}

              {/* Hook */}
              {notes.introduction && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
                  <div className="rounded-2xl px-6 py-5 flex items-start gap-4"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                    <span className="text-2xl shrink-0 mt-0.5">✨</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#818cf8' }}>Proč tě to zajímá</p>
                      <p className="text-base leading-relaxed font-medium" style={{ color: '#e2e8f0' }}>{notes.introduction}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TL;DR */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#2d1f6e,#4c1d95)', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 16px 48px rgba(79,46,220,0.35)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-indigo-300" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">TL;DR — Esence za 10 sekund</span>
                  </div>
                  <p className="text-white text-xl sm:text-2xl font-bold leading-relaxed">{notes.tl_dr}</p>
                  <div className="mt-5 flex justify-end">
                    <button onClick={() => navigator.clipboard.writeText(notes.tl_dr)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.10)', color: '#c4b5fd', border: '1px solid rgba(255,255,255,0.15)' }}>
                      Kopírovat
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Study modules */}
              {notes.deep_modules && notes.deep_modules.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layers className="w-4 h-4" style={{ color: '#818cf8' }} strokeWidth={2} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>Studijní moduly</span>
                    <span className="text-xs" style={{ color: '#334155' }}>({notes.deep_modules.length})</span>
                  </div>
                  {notes.deep_modules.map((mod, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.07 }} className="rounded-2xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-center gap-3 px-5 py-3.5"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                        <span className="shrink-0 w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center"
                          style={{ background: FACT_GRADIENTS[i % FACT_GRADIENTS.length] }}>{i + 1}</span>
                        <h4 className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{mod.title}</h4>
                      </div>
                      <div className="px-5 pt-4 pb-3">
                        <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{mod.explanation}</p>
                      </div>
                      <div className="mx-4 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <span className="text-base shrink-0 mt-0.5">🌍</span>
                        <p className="text-sm italic leading-relaxed" style={{ color: '#c4b5fd' }}>{mod.analogy}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Exam traps */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                        <AlertTriangle className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>Pozor na chytáky!</p>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(notes.exam_traps.join('\n'))}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Kopírovat
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {notes.exam_traps.map((trap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.10)' }}>
                        <span className="shrink-0 text-base mt-0.5">⚠️</span>
                        <p className="text-sm leading-relaxed" style={{ color: '#d4b896' }}>{trap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Memory hack */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                <div style={{ padding: '1.5px', borderRadius: '18px', background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0a1a' }}>
                    <div className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: '1px solid rgba(167,139,250,0.12)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                          <Lightbulb className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#e9d5ff' }}>Mnemotechnická pomůcka</p>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(notes.memory_hack)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Kopírovat
                      </button>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-base leading-relaxed font-medium italic" style={{ color: '#d8b4fe' }}>{notes.memory_hack}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quiz */}
              {notes.interactive_quiz && notes.interactive_quiz.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>🧩 Otestuj se</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Klikni na odpověď — ihned uvidíš vysvětlení</p>
                  </div>
                  <div className="p-4"><InteractiveQuiz questions={notes.interactive_quiz} /></div>
                </motion.div>
              )}

              {/* Flashcards */}
              {notes.flashcards && notes.flashcards.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{t.flashcards.tab}</p>
                  </div>
                  <div className="p-5"><FlashcardGroup flashcards={notes.flashcards} /></div>
                </motion.div>
              )}

              {/* Mind map */}
              {notes.mind_map_mermaid && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.50 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{t.teacher.tabs.mindMap}</p>
                  </div>
                  <div className="p-5"><MermaidDiagram chart={notes.mind_map_mermaid} /></div>
                </motion.div>
              )}

              {/* Game */}
              {notes.interactive_game && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{t.game.tab}</p>
                  </div>
                  <div className="p-5"><InteractiveGame game={notes.interactive_game} /></div>
                </motion.div>
              )}

              {/* Bottom actions */}
              <div className="flex justify-center gap-3 pt-2 pb-6">
                <button onClick={() => navigator.clipboard.writeText(notesText)}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b' }}>
                  <Copy className="w-4 h-4" />{st.copyAll}
                </button>
                <button onClick={handlePDF}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b' }}>
                  <Download className="w-4 h-4" />{st.downloadPDF}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FloatingChat
          documentContext={notes
            ? buildStudentDocContext(notes, inputMode === 'notes' ? 'Vlastní zápisky' : topic, level)
            : null}
        />

        {/* ── Feature demo modals ── */}
        <AnimatePresence>
          {bentoModal && (
            <>
              <motion.div key="bento-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setBentoModal(null)}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }} />

              <motion.div key="bento-modal"
                initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
                <div className="rounded-3xl overflow-hidden"
                  style={{ background: '#080814', border: '1px solid rgba(99,102,241,0.22)', boxShadow: '0 32px 80px rgba(0,0,0,0.80)', backdropFilter: 'blur(20px)' }}>
                  <div className="h-0.5 w-full" style={{ background:
                    bentoModal === 'podcast'    ? 'linear-gradient(90deg,#db2777,#f472b6)' :
                    bentoModal === 'quiz'       ? 'linear-gradient(90deg,#6366f1,#a855f7)' :
                    bentoModal === 'flashcards' ? 'linear-gradient(90deg,#059669,#34d399)' :
                    'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black" style={{ color: '#f1f5f9' }}>
                        {bentoModal === 'podcast'    ? '🎧 Audio Tutor — Demo' :
                         bentoModal === 'quiz'       ? '🧩 Interaktivní kvíz — Demo' :
                         bentoModal === 'flashcards' ? '📕 Flashkarty — Demo' : '🕹️ Minigra — Demo'}
                      </p>
                      <button onClick={() => setBentoModal(null)} className="text-lg hover:opacity-70" style={{ color: '#475569' }}>✕</button>
                    </div>

                    {bentoModal === 'podcast' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl p-4" style={{ background: 'rgba(219,39,119,0.08)', border: '1px solid rgba(219,39,119,0.18)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(219,39,119,0.15)', border: '1px solid rgba(219,39,119,0.30)' }}>
                              <span>👩‍🏫</span><span className="text-xs font-bold" style={{ color: '#f472b6' }}>Učitelka</span>
                              {bentoAudioPlaying && <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: '#db2777' }} />}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}>
                              <span>👨‍🎓</span><span className="text-xs font-bold" style={{ color: '#818cf8' }}>Student</span>
                            </div>
                          </div>
                          <div className="flex items-end gap-[3px] h-8">
                            {Array.from({ length: 20 }, (_, i) => i).map(i => (
                              <motion.div key={i} className="w-[3px] rounded-full flex-1"
                                style={{ background: 'linear-gradient(to top,#db2777,#f472b6)' }}
                                animate={bentoAudioPlaying ? { scaleY: [0.2, 1, 0.3, 0.8, 0.15, 1, 0.5] } : { scaleY: 0.12 }}
                                transition={{ duration: 0.55 + (i % 4) * 0.12, repeat: bentoAudioPlaying ? Infinity : 0, ease: 'easeInOut', delay: i * 0.04 }} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs italic" style={{ color: '#64748b' }}>&ldquo;Hele, víš co je na fotosyntéze úplně fascinující? Hmm — počkej, tohle mě taky dostalo...&rdquo;</p>
                        <button onClick={() => setBentoAudioPlaying(p => !p)}
                          className="w-full py-3 rounded-2xl font-bold text-sm text-white"
                          style={{ background: 'linear-gradient(135deg,#db2777,#f472b6)', boxShadow: '0 4px 16px rgba(219,39,119,0.40)' }}>
                          {bentoAudioPlaying ? '⏸ Pozastavit' : '▶ Přehrát demo podcast'}
                        </button>
                      </div>
                    )}

                    {bentoModal === 'quiz' && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Která z možností NENÍ výsledkem fotosyntézy?</p>
                        {['Kyslík (O₂)', 'Glukóza (C₆H₁₂O₆)', 'Oxid uhličitý (CO₂)', 'ATP energie'].map((opt, i) => (
                          <div key={opt} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                            style={{ background: i === 2 ? 'rgba(5,150,105,0.15)' : 'rgba(255,255,255,0.04)', border: i === 2 ? '1px solid rgba(5,150,105,0.40)' : '1px solid rgba(255,255,255,0.07)', color: i === 2 ? '#34d399' : '#94a3b8' }}>
                            <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0"
                              style={{ background: i === 2 ? 'rgba(5,150,105,0.25)' : 'rgba(255,255,255,0.06)', color: i === 2 ? '#34d399' : '#64748b' }}>
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            <span className="text-sm flex-1">{opt}</span>
                            {i === 2 && <span className="text-xs font-bold" style={{ color: '#34d399' }}>✓</span>}
                          </div>
                        ))}
                        <p className="text-xs px-1" style={{ color: '#64748b' }}>💡 CO₂ je vstupní surovina fotosyntézy, ne produkt.</p>
                      </div>
                    )}

                    {bentoModal === 'flashcards' && (
                      <div className="space-y-4">
                        <p className="text-xs text-center" style={{ color: '#475569' }}>Klikni na kartu pro otočení</p>
                        <button onClick={() => setBentoFlipped(f => !f)}
                          className="w-full h-32 rounded-2xl flex items-center justify-center p-6 transition-all"
                          style={{ background: bentoFlipped ? 'rgba(5,150,105,0.12)' : 'rgba(99,102,241,0.10)', border: bentoFlipped ? '1px solid rgba(5,150,105,0.35)' : '1px solid rgba(99,102,241,0.30)' }}>
                          <motion.p key={String(bentoFlipped)} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }}
                            transition={{ duration: 0.25 }} className="text-base font-bold text-center"
                            style={{ color: bentoFlipped ? '#34d399' : '#a78bfa' }}>
                            {bentoFlipped ? 'Přeměna světelné energie na chemickou (glukózu) pomocí chlorofylu' : 'Fotosyntéza'}
                          </motion.p>
                        </button>
                        <p className="text-xs text-center" style={{ color: '#334155' }}>Pojem 1 z 10 · {bentoFlipped ? 'Definice — klikni zpět' : 'Klikni pro definici →'}</p>
                      </div>
                    )}

                    {bentoModal === 'game' && (
                      <div className="space-y-3">
                        <p className="text-xs" style={{ color: '#64748b' }}>Přiřaď pojmy k definicím:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[['Chlorofyl', 'Zelené barvivo'], ['Stomata', 'Průduchy listu'], ['Glukóza', 'Cukr = energie']].map(([term, def]) => (
                            <div key={term} className="contents">
                              <div className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a78bfa' }}>{term}</div>
                              <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>{def}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-center" style={{ color: '#334155' }}>Generuj téma pro plnou hru ↑</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        {!notes && !loading && (
          <footer className="text-center py-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: '#4a4560' }}>
              Teachio · made with ☕ a 🧠
            </p>
          </footer>
        )}

      </div>
    </div>
  )
}
