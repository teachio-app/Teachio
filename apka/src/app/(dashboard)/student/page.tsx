'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExamCalendar, type ExamCalendarHandle } from '@/components/student/ExamCalendar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Zap, AlertTriangle, Lightbulb,
  Copy, Check, Download, Layers,
  BookMarked, FileText, UploadCloud, X as XIcon,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { SmartNotes, StudyLevel, ExamGoal } from '@/types'
import { saveSession, appendHistory, detectTools } from '@/lib/studyHistory'
import { OnboardingTooltip } from '@/components/student/OnboardingTooltip'

// ── Lazy-loaded heavy components (only bundled when results are shown) ─────────
const InteractiveQuiz = dynamic(() => import('@/components/student/InteractiveQuiz').then(m => ({ default: m.InteractiveQuiz })), { ssr: false })
const AudioPlayer     = dynamic(() => import('@/components/student/AudioPlayer').then(m => ({ default: m.AudioPlayer })),     { ssr: false })
const PodcastPlayer   = dynamic(() => import('@/components/student/PodcastPlayer').then(m => ({ default: m.PodcastPlayer })), { ssr: false })
const FlashcardGroup  = dynamic(() => import('@/components/student/FlashcardGroup').then(m => ({ default: m.FlashcardGroup })), { ssr: false })
const InteractiveGame = dynamic(() => import('@/components/student/InteractiveGame').then(m => ({ default: m.InteractiveGame })), { ssr: false })
const MermaidDiagram  = dynamic(() => import('@/components/student/MermaidDiagram').then(m => ({ default: m.MermaidDiagram })),  { ssr: false })
const FloatingChat    = dynamic(() => import('@/components/ui/FloatingChat').then(m => ({ default: m.FloatingChat })),          { ssr: false })

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

const UPLOAD_PHASES = [
  'Nahrávám soubor…',
  'Čtu PDF…',
  'Detekcuji skenované stránky…',
  'Rozpoznávám text (OCR)…',
  'Extrahuji obsah…',
  'Analyzuji pojmy…',
]

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
    label: 'Školní písemka',
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
    label: 'Maturita',
    desc: 'Státní standardy, didaktické pasti',
    accent: '#db2777',
    bg: 'rgba(219,39,119,0.07)',
  },
  {
    value: 'statni-zaverecne',
    icon: '🏛',
    label: 'Státní zkoušky',
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
    return { ...base, label: 'Semestrální zkouška', desc: 'Standardní semestrální zkouška' }
  }
  return base
}

const STUDY_FACTS = [
  'Mozek si pamatuje lépe, když látku opakuješ s rozestupem (spaced repetition).',
  'Aktivní vybavování informací je 2× efektivnější než pasivní čtení.',
  'Vysvětlení pojmu vlastními slovy zvýší jeho zapamatování o 40 %.',
  'Krátké přestávky každých 25 minut zvyšují soustředěnost a výkon.',
  'Spánek po učení konsoliduje vzpomínky — nečti celou noc!',
  'Psaní rukou pomáhá lépe zpracovat a zapamatovat si informace.',
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
      style={done
        ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)', color: '#6ee7b7' }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#62627a' }
      }>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Zkopírováno' : label}
    </button>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-10 text-center space-y-6"
        style={{ background: 'rgba(17,17,24,0.95)', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
          >
            <Brain className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.p key={message}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
              className="font-semibold text-lg" style={{ color: '#f4f4f8' }}>
              {message}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm" style={{ color: '#62627a' }}>Může trvat cca 30 vteřin</p>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
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

const GEN_PHASES  = [
  { min: 85, label: 'Finalizuji plán…' },
  { min: 55, label: 'Generuji kvízy a kartičky…' },
  { min: 20, label: 'Plánuji kapitoly…' },
  { min: 0,  label: 'Analyzuji materiály…' },
]
const BYON_PHASES = [
  { min: 85, label: 'Finalizuji plán…' },
  { min: 55, label: 'Generuji kvízy a kartičky…' },
  { min: 20, label: 'Organizuji zápisky…' },
  { min: 0,  label: 'Čtu tvoje zápisky…' },
]

function getPhaseLabel(pct: number, isBYON: boolean) {
  const phases = isBYON ? BYON_PHASES : GEN_PHASES
  return phases.find(p => pct >= p.min)?.label ?? phases[phases.length - 1].label
}

function LoadingStateEnhanced({ isBYON }: { isBYON: boolean }) {
  const [pct, setPct] = useState(0)
  const [factIdx, setFactIdx] = useState(0)

  useEffect(() => {
    setPct(0)
    const step = setInterval(() => {
      setPct(p => {
        const next = p + (p < 70 ? 1.8 : p < 90 ? 0.6 : 0.2)
        return Math.min(next, 96)
      })
    }, 400)
    return () => clearInterval(step)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setFactIdx(i => (i + 1) % STUDY_FACTS.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: 'rgba(17,17,24,0.98)', border: '1px solid rgba(124,58,237,0.30)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)' }}>

      {/* Gradient progress bar at top */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7,#c084fc)' }}
        />
      </div>

      <div className="p-10 text-center space-y-7">

        {/* Animated orb */}
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #a855f7, #7c3aed 60%, #4f46e5)',
              boxShadow: '0 0 60px rgba(124,58,237,0.6), 0 0 120px rgba(168,85,247,0.2)',
            }}
          >
            <Brain className="w-10 h-10 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Percentage */}
        <div>
          <AnimatePresence mode="wait">
            <motion.span
              key={Math.floor(pct / 5)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
              className="text-5xl font-black tabular-nums"
              style={{
                background: 'linear-gradient(135deg,#a855f7,#c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: 'var(--font-bricolage, Inter), sans-serif',
              }}>
              {Math.round(pct)}%
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Phase label tied to percentage */}
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.p key={getPhaseLabel(pct, isBYON)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
              className="font-semibold text-lg" style={{ color: '#f4f4f8' }}>
              {getPhaseLabel(pct, isBYON)}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm" style={{ color: '#62627a' }}>Může trvat cca 30 vteřin</p>
        </div>

        {/* Study fact */}
        <div className="rounded-2xl px-5 py-4"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
          <AnimatePresence mode="wait">
            <motion.p key={factIdx}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="text-sm" style={{ color: '#a1a1b8' }}>
              💡 <span style={{ color: '#c4b5fd' }}>Věděl/a jsi, že…</span> {STUDY_FACTS[factIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Topic-aware bento demo content ───────────────────────────────────────────

type DemoSubject = 'history' | 'math' | 'physics' | 'biology' | 'chemistry' | 'literature' | 'geography' | 'civics' | 'general'

interface BentoDemoContent {
  podcastSnippet: string
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }
  flashcard: { front: string; back: string }
  gamePairs: [string, string][]
}

const DEMO_SUBJECT_REGEXES: Array<[DemoSubject, RegExp]> = [
  ['history',    /revoluc|válk|reich|nacis|komunis|imperiál|koloniál|feudál|středověk|renesanc|antik|dynasti|bitv|habsbur|napoleo|husit|světová válk|studená válk/i],
  ['math',       /rovnic|trojúhelník|kružnic|obvod|obsah|objem|funkce|derivac|integrál|algebra|geometri|zlomek|procent|pravděpodobn|statistik|vektor|logaritm|kombinatorik|kvadratic|pythagoro/i],
  ['physics',    /síla|energie.*fyz|rychlost|zrychlení|elektřina|magnetism|gravitac|vlnění|elektron|proud.*fyz|napětí|odpor.*fyz|hybnost|optik|spektr|radioaktiv|kvantov|newtonov|relativit|termodynamik/i],
  ['biology',    /buňka|fotosyntéz|dna|rna|evoluc|ekologi|biotop|metabolism|enzym|hormon|organismus|rostlin|živočich|houba|bakterie|virus|imunit|genetik|dědičnost|chromozom|protein|mitóza|ekosystém/i],
  ['chemistry',  /prvek|sloučenin|kyselina|zásada|oxidac|redukc|elektrolýz|polymer|periodická|molár|stechiometri|roztok|ionizace|uhlovodík/i],
  ['literature', /báseň|román|povídka|spisovatel|literární|postava|lyrický|epický|dramatický|próza|poezie|drama|novela|epos|balada|sonet|mácha|neruda|čapek|shakespeare|kafka|hašek|literatura/i],
  ['geography',  /zeměpis|kontinent|pohoří|moře|oceán|podnebí|reliéf|krajina|poloostrov|ostrov|klima|ekvátor|tropic|asie|evropa|afrika|austrálie|amérika/i],
  ['civics',     /právo|zákon|ústava|parlament|vláda|prezident|volby|lidská práva|demokracie|soud|trestní/i],
]

function detectDemoSubject(topic: string): DemoSubject {
  for (const [subject, re] of DEMO_SUBJECT_REGEXES) {
    if (re.test(topic)) return subject
  }
  return 'general'
}

const FALLBACK_DEMO: BentoDemoContent = {
  podcastSnippet: 'Hele, víš co je na fotosyntéze úplně fascinující? Hmm — počkej, tohle mě taky dostalo...',
  quiz: {
    question: 'Která z možností NENÍ výsledkem fotosyntézy?',
    options: ['Kyslík (O₂)', 'Glukóza (C₆H₁₂O₆)', 'Oxid uhličitý (CO₂)', 'ATP energie'],
    correctIndex: 2,
    explanation: 'CO₂ je vstupní surovina fotosyntézy, ne produkt.',
  },
  flashcard: { front: 'Fotosyntéza', back: 'Přeměna světelné energie na chemickou (glukózu) pomocí chlorofylu' },
  gamePairs: [['Chlorofyl', 'Zelené barvivo listu'], ['Stomata', 'Průduchy listu'], ['Glukóza', 'Cukr = energie']],
}

function buildTopicDemo(topic: string): BentoDemoContent {
  if (!topic.trim()) return FALLBACK_DEMO
  const tp = topic.trim()
  const subject = detectDemoSubject(tp)

  const DEMOS: Record<DemoSubject, BentoDemoContent> = {
    history: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom to byl zlom, který změnil svět navždy…`,
      quiz: {
        question: `Která z možností NEJLÉPE vystihuje hlavní dopad „${tp}"?`,
        options: ['Zásadní proměna politického a společenského řádu', 'Posílení stávající vládnoucí vrstvy', 'Izolovaná událost bez dlouhodobých důsledků', 'Čistě ekonomická záležitost bez politického dopadu'],
        correctIndex: 0,
        explanation: `„${tp}" patří k událostem, které hluboce proměnily společenské struktury a otevřely novou historickou epochu.`,
      },
      flashcard: { front: `Hlavní příčiny — ${tp}`, back: 'Souhrn politických, sociálních a ekonomických napětí, která vedla k dramatické historické změně.' },
      gamePairs: [['Revoluce', 'Násilná nebo nenásilná změna společenského řádu'], ['Manifest', 'Politický program nebo prohlášení hnutí'], ['Třída', 'Socioekonomická skupina sdílející postavení ve společnosti']],
    },
    math: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom stačí jeden správný pohled a najednou to dává smysl…`,
      quiz: {
        question: `Co je klíčovým předpokladem správného řešení úlohy „${tp}"?`,
        options: ['Správná identifikace dané informace a neznámé', 'Přibližný odhad bez výpočtu', 'Zapamatování vzorce bez porozumění', 'Náhodné dosazení čísel'],
        correctIndex: 0,
        explanation: `V úlohách na „${tp}" je vždy zásadní nejprve správně určit, co je dáno a co hledáme.`,
      },
      flashcard: { front: tp, back: 'Matematický pojem nebo postup — přesná definice a vzorec.' },
      gamePairs: [['Vzorec', 'Symbolický zápis matematického vztahu'], ['Proměnná', 'Neznámá hodnota v rovnici'], ['Důkaz', 'Logická argumentace potvrzující platnost tvrzení']],
    },
    physics: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom je to ten typ fyziky, který vidíš každý den kolem sebe…`,
      quiz: {
        question: `Který zákon je základem pro pochopení „${tp}"?`,
        options: ['Zákon zachování energie', 'Náhodná fluktuace bez zákonitostí', 'Biologický princip bez fyzikálního základu', 'Chemická reakce bez energetické bilance'],
        correctIndex: 0,
        explanation: `Fyzikální jevy jako „${tp}" se řídí fundamentálními zákony přírody — zejména zachováním energie.`,
      },
      flashcard: { front: tp, back: 'Fyzikální jev nebo zákon — přesná definice a klíčový vzorec.' },
      gamePairs: [['Energie', 'Schopnost konat práci'], ['Síla', 'Interakce způsobující zrychlení tělesa'], ['Výkon', 'Vykonaná práce za jednotku času']],
    },
    biology: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom to je základ celého života, jak ho známe…`,
      quiz: {
        question: `Která z možností NEJLÉPE popisuje biologický význam „${tp}"?`,
        options: ['Zásadní proces udržující život organismu', 'Vedlejší jev bez vlivu na organismus', 'Fyzikální zákon bez biologické relevance', 'Chemická reakce izolovaná od živých soustav'],
        correctIndex: 0,
        explanation: `„${tp}" hraje klíčovou roli v biologii — ovlivňuje životní funkce na buněčné nebo systémové úrovni.`,
      },
      flashcard: { front: tp, back: 'Biologický pojem nebo proces — přesná definice.' },
      gamePairs: [['Buňka', 'Základní stavební a funkční jednotka života'], ['Metabolismus', 'Soubor chemických reakcí v organismu'], ['Enzym', 'Biologický katalyzátor urychlující reakce']],
    },
    chemistry: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom ta chemie dělá přesně tohle každou vteřinu kolem nás…`,
      quiz: {
        question: `Která z možností NEJLÉPE charakterizuje „${tp}"?`,
        options: ['Přeměna látek vedoucí ke vzniku nových produktů', 'Fyzický jev bez chemické změny', 'Biologický proces bez molekulárního základu', 'Náhodná změna bez zákonitostí'],
        correctIndex: 0,
        explanation: `Chemické téma „${tp}" popisuje přeměnu nebo vlastnosti látek na atomární nebo molekulární úrovni.`,
      },
      flashcard: { front: tp, back: 'Chemický pojem, reakce nebo látka — přesná definice.' },
      gamePairs: [['Prvek', 'Čistá látka složená z atomů jednoho druhu'], ['Molekula', 'Skupina atomů spojených chemickými vazbami'], ['Reakce', 'Přeměna látek za vzniku nových sloučenin']],
    },
    literature: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom ta díla dodnes rezonují, i když vznikla před staletími…`,
      quiz: {
        question: `Co je literárně NEJDŮLEŽITĚJŠÍM aspektem tématu „${tp}"?`,
        options: ['Umělecká forma a sdělení díla v historickém kontextu', 'Počet stránek díla', 'Datum vzniku bez ohledu na obsah', 'Obchodní úspěch v době vydání'],
        correctIndex: 0,
        explanation: `Při studiu „${tp}" sledujeme především umělecké hodnoty, tematiku a historický kontext vzniku díla.`,
      },
      flashcard: { front: tp, back: 'Literární dílo, autor nebo směr — klíčové charakteristiky a historický kontext.' },
      gamePairs: [['Lyrika', 'Básnický žánr vyjadřující subjektivní pocity'], ['Epika', 'Vypravěčský žánr s dějem a postavami'], ['Dramatika', 'Divadelní žánr určený k inscenování']],
    },
    geography: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom to místo nebo jev formuje životy milionů lidí každý den…`,
      quiz: {
        question: `Který faktor má NEJVĚTŠÍ vliv na charakter „${tp}"?`,
        options: ['Přírodní podmínky a poloha ovlivňující klima a osídlení', 'Náhodné historické události bez geografické podmíněnosti', 'Výhradně ekonomické faktory bez vazby na přírodu', 'Kulturní vlivy bez ohledu na přírodní prostředí'],
        correctIndex: 0,
        explanation: `Geografie „${tp}" je podmíněna kombinací přírodních faktorů — polohou, reliéfem a klimatem.`,
      },
      flashcard: { front: tp, back: 'Geografický pojem, oblast nebo jev — klíčové charakteristiky polohy a přírodních podmínek.' },
      gamePairs: [['Reliéf', 'Povrchové tvary zemského povrchu'], ['Klima', 'Dlouhodobé průměrné počasí v dané oblasti'], ['Migrace', 'Pohyb obyvatelstva z jednoho místa na druhé']],
    },
    civics: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Přitom to přímo ovlivňuje práva a povinnosti každého z nás…`,
      quiz: {
        question: `Proč je znalost tématu „${tp}" důležitá pro každého občana?`,
        options: ['Umožňuje aktivní účast v demokratickém systému a ochranu práv', 'Je povinná pouze pro právníky a politiky', 'Nemá přímý dopad na každodenní život', 'Slouží pouze akademickým účelům'],
        correctIndex: 0,
        explanation: `„${tp}" je základem občanské gramotnosti — pomáhá pochopit práva, povinnosti a fungování státu.`,
      },
      flashcard: { front: tp, back: 'Právní nebo politický pojem — definice a praktický dopad na občanský život.' },
      gamePairs: [['Demokracie', 'Vláda lidu prostřednictvím volených zástupců'], ['Ústava', 'Základní zákon státu definující práva a orgány'], ['Parlament', 'Zákonodárný sbor volený občany']],
    },
    general: {
      podcastSnippet: `Hele, víš co je na „${tp}" úplně fascinující? Hmm — počkej, tohle mě taky dostalo…`,
      quiz: {
        question: `Která z možností NEJLÉPE vystihuje podstatu tématu „${tp}"?`,
        options: ['Systematické porozumění klíčovým principům a souvislostem', 'Povrchní znalost bez hlubšího kontextu', 'Memorování faktů bez porozumění', 'Izolované informace bez vzájemné vazby'],
        correctIndex: 0,
        explanation: `Pochopení „${tp}" vyžaduje systematický přístup — znát klíčové pojmy, jejich vztahy a praktické dopady.`,
      },
      flashcard: { front: tp, back: 'Klíčový pojem z tohoto tématu — klikni zpět pro přesnou definici.' },
      gamePairs: [['Kontext', 'Okolnosti a pozadí dané situace nebo jevu'], ['Analýza', 'Rozbor celku na části za účelem porozumění'], ['Syntéza', 'Propojení poznatků do uceleného celku']],
    },
  }
  return DEMOS[subject]
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const { lang, t } = useLanguage()
  const st = t.student        // shorthand
  const router = useRouter()
  const [inputMode, setInputMode] = useState<InputMode>('topic')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [isDragOver,     setIsDragOver]     = useState(false)
  const [showTextarea,   setShowTextarea]   = useState(false)
  const [uploadMeta, setUploadMeta] = useState<{
    files: Array<{ name: string; docType: string; pages?: number; chars: number }>
    totalChars: number
  } | null>(null)
  const uploadParsing = uploadProgress !== null
  const [uploadPhaseIdx, setUploadPhaseIdx] = useState(0)

  // Cycle through upload phase labels while a parse is in progress
  useEffect(() => {
    if (!uploadParsing) { setUploadPhaseIdx(0); return }
    const id = setInterval(() => setUploadPhaseIdx(i => (i + 1) % UPLOAD_PHASES.length), 1800)
    return () => clearInterval(id)
  }, [uploadParsing])

  const [topic,     setTopic]     = useState('')
  const [rawNotes,  setRawNotes]  = useState('')
  const [level,     setLevel]     = useState<StudyLevel>('SŠ')
  const [examGoal,  setExamGoal]  = useState<ExamGoal>('bezna-pisemka')
  const [loading,   setLoading]   = useState(false)
  const [notes,     setNotes]     = useState<SmartNotes | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const calendarRef = useRef<ExamCalendarHandle>(null)
  const [bentoModal, setBentoModal] = useState<'podcast' | 'quiz' | 'flashcards' | 'game' | null>(null)
  const [bentoFlipped, setBentoFlipped] = useState(false)
  const [bentoAudioPlaying, setBentoAudioPlaying] = useState(false)

  const demoContent = useMemo(() => buildTopicDemo(topic), [topic])

  // Clear results and all upload state when switching input mode
  useEffect(() => {
    setNotes(null)
    setError(null)
    setUploadMeta(null)
    setUploadError(null)
    setShowTextarea(false)
    setIsDragOver(false)
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
          window.dispatchEvent(new CustomEvent('credits-updated'))
          window.dispatchEvent(new CustomEvent('upgrade-modal-open'))
          return
        }
        throw new Error(d.error)
      }
      window.dispatchEvent(new CustomEvent('credits-updated'))
      const result = await res.json() as import('@/types').SmartNotes
      setNotes(result)
      // Propagate detected topic so all topic-aware UI updates (bento demos, ExamCalendar, action bar)
      const effectiveTopic = (isBYON && result.detected_topic) ? result.detected_topic : topic
      if (isBYON && result.detected_topic) setTopic(result.detected_topic)
      // Persist session + history for feature pages and Výpisky
      saveSession({ notes: result, topic: effectiveTopic, level, examGoal, timestamp: Date.now() })
      appendHistory({ topic: effectiveTopic, level, examGoal, timestamp: Date.now(), tools: detectTools(result) })
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
    const metaFiles: Array<{ name: string; docType: string; pages?: number; chars: number }> = []
    let failed = 0
    let lastServerError: string | null = null

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress({ current: i + 1, total: files.length })
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/parse-document', { method: 'POST', body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          lastServerError = body.error ?? null
          console.warn(`[upload] ${file.name}:`, body.error)
          failed++; continue
        }
        const parsed = await res.json() as {
          text: string; chars: number; docType: string; pages?: number; filename?: string;
          quality?: number; lang?: string | null; scanned?: boolean; method?: string
        }
        parts.push(files.length > 1 ? `\n--- ${file.name} ---\n\n${parsed.text}` : parsed.text)
        metaFiles.push({ name: file.name, docType: parsed.docType, pages: parsed.pages, chars: parsed.chars })
        if (parsed.scanned && parsed.method === 'ocr') {
          console.info(`[upload] ${file.name}: scanned PDF, OCR extraction used (quality=${parsed.quality ?? '?'}%)`)
        }
      } catch (err) {
        console.warn(`[upload] ${file.name}:`, err)
        lastServerError = err instanceof Error ? err.message : st.upload.error
        failed++
      }
    }

    if (parts.length > 0) {
      const merged = parts.join('\n\n').trim()
      setRawNotes(prev => (prev.trim() ? prev.trim() + '\n\n' + merged : merged))
      setUploadMeta(prev => {
        const all = [...(prev?.files ?? []), ...metaFiles]
        return { files: all, totalChars: all.reduce((s, f) => s + f.chars, 0) }
      })
    }
    if (failed === files.length) setUploadError(lastServerError ?? st.upload.error)
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

  // Quick topic chips removed — only functional actions kept

  return (
    // True full-bleed: 100vw with calc trick breaks out of max-w-6xl container
    // The dark background comes from layout.tsx (fixed full-viewport layer)
    <div
      className="-mt-10 -mb-10 relative"
      style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', minHeight: '100vh' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-28 sm:pb-12">

        {/* ── Logo + tagline ── */}
        <div className="text-center space-y-2 pt-2 mb-8">
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)',
                boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <Brain className="w-7 h-7 text-white" strokeWidth={1.5} />
            </motion.div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: '#f1f5f9' }}>
            Co se dnes chceš naučit?
          </h1>
          <p style={{ color: '#a0aec0', fontSize: '16px' }}>
            Zadej téma nebo nahraj zápisky — Teachio vygeneruje vše za tebe
          </p>
        </div>

        {/* ── Main two-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* LEFT: generator + loading + results */}
        <div className="lg:col-span-8 space-y-7">

        {/* ── Central AI Input Bar ── */}
        <form onSubmit={submit}>
          <div
            className="rounded-3xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(124,58,237,0.30)',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.10), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Mode toggle */}
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {([
                { mode: 'topic' as InputMode, icon: BookMarked, label: '✨ Zadat téma' },
                { mode: 'notes' as InputMode, icon: FileText,   label: '📄 Nahrát zápisky / PDF' },
              ] as const).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode} type="button" onClick={() => setInputMode(mode)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all"
                  style={{
                    color: inputMode === mode ? '#a78bfa' : '#475569',
                    background: inputMode === mode ? 'rgba(124,58,237,0.10)' : 'transparent',
                    borderBottom: inputMode === mode ? '2px solid #7c3aed' : '2px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="p-4 sm:p-6 space-y-4">

              {inputMode === 'topic' ? (
                <div className="relative">
                  <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Např. Fotosyntéza, Druhá světová válka, Newtonovy zákony…"
                    className="w-full bg-transparent border-0 outline-none text-base placeholder-slate-600 font-medium"
                    style={{ color: '#f1f5f9', fontSize: '16px', minHeight: '60px', resize: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (topic.trim()) submit(e as unknown as React.FormEvent) } }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Drop zone */}
                  <label
                    className="relative flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      borderColor: isDragOver ? '#7c3aed' : uploadParsing ? '#a78bfa' : rawNotes ? '#4ade80' : 'rgba(124,58,237,0.25)',
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
                          {uploadProgress.total > 1
                            ? `${UPLOAD_PHASES[uploadPhaseIdx].replace('…', '')} ${uploadProgress.current}/${uploadProgress.total}…`
                            : UPLOAD_PHASES[uploadPhaseIdx]}
                        </p>
                        <p className="text-xs" style={{ color: '#475569' }}>PDF · DOCX · obrázek · TXT</p>
                      </div>
                    ) : rawNotes ? (
                      <div className="text-center space-y-1.5 pointer-events-none">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(74,222,128,0.15)' }}>
                          <Check className="w-5 h-5" style={{ color: '#4ade80' }} strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                          {uploadMeta
                            ? uploadMeta.files.length === 1
                              ? `${uploadMeta.files[0].docType === 'pdf'
                                  ? `📄 ${uploadMeta.files[0].pages ? `${uploadMeta.files[0].pages}-stránkový PDF` : 'PDF'}`
                                  : uploadMeta.files[0].docType === 'image'
                                  ? '🖼️ Screenshot'
                                  : `📝 ${uploadMeta.files[0].name.split('.').pop()?.toUpperCase()}`
                                } načten ✓`
                              : `${uploadMeta.files.length} soubory načteny ✓`
                            : 'Obsah načten ✓'}
                        </p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {uploadMeta
                            ? `${(uploadMeta.totalChars).toLocaleString('cs')} znaků extrahováno · Klikni pro přidání dalšího`
                            : `${rawNotes.length.toLocaleString('cs')} znaků · Přetáhni další pro přidání`}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 pointer-events-none">
                        <motion.div animate={isDragOver ? { scale: 1.15 } : { scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                          style={{ background: 'rgba(124,58,237,0.12)' }}>
                          <UploadCloud className="w-6 h-6" style={{ color: '#a78bfa' }} strokeWidth={1.8} />
                        </motion.div>
                        <p className="text-sm font-bold" style={{ color: '#94a3b8' }}>
                          {isDragOver ? '🎯 Pusť soubory!' : 'Přetáhni PDF, DOCX, obrázek nebo TXT'}
                        </p>
                        <p className="text-xs" style={{ color: '#475569' }}>nebo klikni pro výběr · více souborů najednou · screenshots podporovány</p>
                      </div>
                    )}
                    <input type="file" multiple
                      accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                      className="sr-only" onChange={handleFileUpload} disabled={uploadParsing} />
                  </label>

                  {/* Controls row */}
                  <div className="flex items-center justify-between">
                    {rawNotes ? (
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowTextarea(v => !v)}
                          className="text-xs font-semibold transition-colors" style={{ color: '#7c3aed' }}>
                          {showTextarea ? '▲ Skrýt' : '✏️ Upravit text'}
                        </button>
                        <button type="button" onClick={() => { setRawNotes(''); setShowTextarea(false); setUploadMeta(null) }}
                          className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#475569' }}>
                          <XIcon className="w-3 h-3" />Smazat
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowTextarea(v => !v)}
                        className="text-xs underline underline-offset-2 transition-colors" style={{ color: '#475569' }}>
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
                          style={{
                            minHeight: '160px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9',
                            fontSize: '13px',
                          }}
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

              {/* ── Settings row: level + goal + submit ── */}
              <div className="flex flex-wrap items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Level pills */}
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {STUDY_LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setLevel(l)}
                      className="px-3 py-1.5 text-xs font-bold transition-all"
                      style={{
                        background: level === l ? 'rgba(124,58,237,0.30)' : 'transparent',
                        color: level === l ? '#c4b5fd' : '#475569',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Goal selector */}
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {GOAL_BY_LEVEL[level].map(gv => {
                    const g = EXAM_GOALS.find(x => x.value === gv)!
                    return (
                      <button key={gv} type="button" onClick={() => setExamGoal(gv)}
                        className="px-3 py-1.5 text-xs font-bold transition-all"
                        style={{
                          background: examGoal === gv ? 'rgba(124,58,237,0.30)' : 'transparent',
                          color: examGoal === gv ? '#c4b5fd' : '#475569',
                        }}>
                        {g.icon} {getGoalMeta(gv, level).label}
                      </button>
                    )
                  })}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (inputMode === 'notes' ? rawNotes.trim().length < 20 : !topic.trim())}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(124,58,237,0.4)'
                      : 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.40)',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                      Generuji…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" strokeWidth={2.5} />
                      {inputMode === 'notes' ? 'Zpracovat zápisky' : 'Vygenerovat'}
                    </>
                  )}
                </button>
              </div>

              {/* ── Secondary actions ── */}
              {!loading && (
                <div className="flex items-center flex-wrap gap-2 pt-1 lg:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#334155' }}>nebo rovnou:</span>
                  <button type="button" onClick={() => calendarRef.current?.openModal(topic || undefined)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.22)', color: '#a78bfa' }}>
                    🗓️ Studijní plán
                  </button>
                  <button type="button" onClick={() => setBentoModal('podcast')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(219,39,119,0.08)', border: '1px solid rgba(219,39,119,0.18)', color: '#f472b6' }}>
                    🎧 Audio Tutor
                  </button>
                </div>
              )}

              {/* Error */}
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

        {/* ── Bento grid — shown on mobile only in idle state ── */}
        {!notes && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">

            {/* Feature: Podcast */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => { setBentoModal('podcast'); setBentoAudioPlaying(false) }}
                className="w-full p-5 space-y-3 text-left hover:bg-white/[0.02] active:bg-white/[0.01] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(219,39,119,0.15)' }}>
                  <span className="text-xl">🎧</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Výukový podcast</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#475569' }}>Učitelka a student diskutují tvé téma jako virální radio show</p>
                </div>
              </button>
              <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => { setBentoModal('podcast'); setBentoAudioPlaying(false) }}
                  className="flex-1 py-2 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#db2777' }}>Demo →</button>
                <Link href="/student/podcast"
                  className="flex-1 py-2 text-xs font-semibold text-center transition-colors hover:opacity-80 border-l" style={{ color: '#f472b6', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Otevřít →
                </Link>
              </div>
            </div>

            {/* Feature: Quiz */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setBentoModal('quiz')}
                className="w-full p-5 space-y-3 text-left hover:bg-white/[0.02] active:bg-white/[0.01] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <span className="text-xl">🧩</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Interaktivní kvíz</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#475569' }}>5 otázek s okamžitým vysvětlením — testuje porozumění, ne jen memorii</p>
                </div>
              </button>
              <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setBentoModal('quiz')}
                  className="flex-1 py-2 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#6366f1' }}>Demo →</button>
                <Link href="/student/quiz"
                  className="flex-1 py-2 text-xs font-semibold text-center transition-colors hover:opacity-80 border-l" style={{ color: '#a78bfa', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Otevřít →
                </Link>
              </div>
            </div>

            {/* Feature: Flashcards */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => { setBentoModal('flashcards'); setBentoFlipped(false) }}
                className="w-full p-5 space-y-3 text-left hover:bg-white/[0.02] active:bg-white/[0.01] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.15)' }}>
                  <span className="text-xl">🃏</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Flashkarty</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#475569' }}>Sada pojmů s definicemi — otočitelné kartičky ve stylu Quizlet</p>
                </div>
              </button>
              <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => { setBentoModal('flashcards'); setBentoFlipped(false) }}
                  className="flex-1 py-2 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#059669' }}>Demo →</button>
                <Link href="/student/flashcards"
                  className="flex-1 py-2 text-xs font-semibold text-center transition-colors hover:opacity-80 border-l" style={{ color: '#34d399', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Otevřít →
                </Link>
              </div>
            </div>

            {/* Feature: Game */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setBentoModal('game')}
                className="w-full p-5 space-y-3 text-left hover:bg-white/[0.02] active:bg-white/[0.01] transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.15)' }}>
                  <span className="text-xl">🕹️</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>Minigra</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#475569' }}>Spáruj pojmy nebo seřaď — učení hrou, ne drillem</p>
                </div>
              </button>
              <div className="flex border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => setBentoModal('game')}
                  className="flex-1 py-2 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: '#d97706' }}>Demo →</button>
                <Link href="/student/game"
                  className="flex-1 py-2 text-xs font-semibold text-center transition-colors hover:opacity-80 border-l" style={{ color: '#fbbf24', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Otevřít →
                </Link>
              </div>
            </div>
          </div>
        )}



        {/* ── Loading ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
            <LoadingStateEnhanced isBYON={inputMode === 'notes'} />
          </motion.div>
        )}

        {/* ── Results ── */}
        <AnimatePresence>
          {notes && !loading && (
            <motion.div key="results" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4">

              {/* Feature page shortcuts */}
              <div className="flex flex-wrap gap-2">
                {notes.interactive_quiz?.length > 0 && (
                  <Link href="/student/quiz"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)', color: '#a78bfa' }}>
                    🧩 Kvíz →
                  </Link>
                )}
                {(notes.podcast_script?.length || notes.audio_script) && (
                  <Link href="/student/podcast"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(219,39,119,0.08)', border: '1px solid rgba(219,39,119,0.18)', color: '#f472b6' }}>
                    🎧 Podcast →
                  </Link>
                )}
                {(notes.flashcards?.length ?? 0) > 0 && (
                  <Link href="/student/flashcards"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.18)', color: '#34d399' }}>
                    🃏 Flashkarty →
                  </Link>
                )}
                {notes.interactive_game && (
                  <Link href="/student/game"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.18)', color: '#fbbf24' }}>
                    🕹️ Minigra →
                  </Link>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold truncate max-w-[180px]" style={{ color: '#a78bfa' }}>
                    {topic || '📝 Zápisky'}
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

              {/* Introduction */}
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

              {/* Deep Modules */}
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

              {/* Exam Traps */}
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
                        <p className="text-sm leading-relaxed" style={{ color: '#d4b896' }}>{trap.replace(/^⚠️\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Memory Hack */}
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
                      <p className="text-base leading-relaxed font-medium italic" style={{ color: '#d8b4fe' }}>
                        {notes.memory_hack}
                      </p>
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

              {/* Mind Map */}
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

        </div> {/* end left col */}

        {/* RIGHT: sticky sidebar — desktop only */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4" style={{ position: 'sticky', top: '72px', alignSelf: 'start' }}>
          <ExamCalendar ref={calendarRef} />
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: '#475569' }}>Rychlé akce</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { icon: '🗓️', label: 'Studijní plán', action: () => calendarRef.current?.openModal(topic || undefined) },
                { icon: '🎧', label: 'Audio Tutor',   action: () => setBentoModal('podcast') },
                { icon: '🎙️', label: 'Podcast',       href: '/student/podcast' },
                { icon: '🧩', label: 'Kvíz',          href: '/student/quiz' },
                { icon: '🃏', label: 'Kartičky',      href: '/student/flashcards' },
                { icon: '🕹️', label: 'Hra',           href: '/student/game' },
              ] as Array<{ icon: string; label: string; href?: string; action?: () => void }>).map(item => 'href' in item && item.href ? (
                <Link key={item.label} href={item.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{item.label}</span>
                </Link>
              ) : (
                <button key={item.label} type="button" onClick={item.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        </div> {/* end grid */}

        <FloatingChat
          documentContext={notes
            ? buildStudentDocContext(notes, inputMode === 'notes' ? 'Vlastní zápisky' : topic, level)
            : null}
        />

      {/* ── Bento feature demo modals ── */}
      <AnimatePresence>
        {bentoModal && (
          <>
            <motion.div key="bento-bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setBentoModal(null)}
              className="fixed inset-0 z-50"
              style={{ background:'rgba(0,0,0,0.80)', backdropFilter:'blur(6px)' }} />

            <motion.div key="bento-modal"
              initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.93, y:20 }}
              transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
              <div className="rounded-3xl overflow-hidden"
                style={{ background:'#080814', border:'1px solid rgba(99,102,241,0.22)', boxShadow:'0 32px 80px rgba(0,0,0,0.80)', backdropFilter:'blur(20px)' }}>
                <div className="h-0.5 w-full" style={{ background:
                  bentoModal==='podcast'?'linear-gradient(90deg,#db2777,#f472b6)':
                  bentoModal==='quiz'?'linear-gradient(90deg,#6366f1,#a855f7)':
                  bentoModal==='flashcards'?'linear-gradient(90deg,#059669,#34d399)':
                  'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black" style={{ color:'#f1f5f9' }}>
                      {bentoModal==='podcast'?'🎧 Audio Tutor — Demo':
                       bentoModal==='quiz'?'🧩 Interaktivní kvíz — Demo':
                       bentoModal==='flashcards'?'🃏 Flashkarty — Demo':'🕹️ Minigra — Demo'}
                    </p>
                    <button onClick={() => setBentoModal(null)} className="text-lg hover:opacity-70" style={{ color:'#475569' }}>✕</button>
                  </div>

                  {bentoModal==='podcast' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl p-4" style={{ background:'rgba(219,39,119,0.08)', border:'1px solid rgba(219,39,119,0.18)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background:'rgba(219,39,119,0.15)', border:'1px solid rgba(219,39,119,0.30)' }}>
                            <span>👩‍🏫</span><span className="text-xs font-bold" style={{ color:'#f472b6' }}>Učitelka</span>
                            {bentoAudioPlaying && <motion.span animate={{ opacity:[1,0.2,1] }} transition={{ duration:0.9, repeat:Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background:'#db2777' }} />}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background:'rgba(99,102,241,0.10)', border:'1px solid rgba(99,102,241,0.20)' }}>
                            <span>👨‍🎓</span><span className="text-xs font-bold" style={{ color:'#818cf8' }}>Student</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-[3px] h-8">
                          {Array.from({length:20},(_,i)=>i).map(i => (
                            <motion.div key={i} className="w-[3px] rounded-full flex-1"
                              style={{ background:'linear-gradient(to top,#db2777,#f472b6)' }}
                              animate={bentoAudioPlaying?{scaleY:[0.2,1,0.3,0.8,0.15,1,0.5]}:{scaleY:0.12}}
                              transition={{ duration:0.55+(i%4)*0.12, repeat:bentoAudioPlaying?Infinity:0, ease:'easeInOut', delay:i*0.04 }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs italic" style={{ color:'#64748b' }}>&ldquo;{demoContent.podcastSnippet}&rdquo;</p>
                      <button onClick={() => setBentoAudioPlaying(p=>!p)}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-white"
                        style={{ background:'linear-gradient(135deg,#db2777,#f472b6)', boxShadow:'0 4px 16px rgba(219,39,119,0.40)' }}>
                        {bentoAudioPlaying?'⏸ Pozastavit':'▶ Přehrát demo podcast'}
                      </button>
                    </div>
                  )}

                  {bentoModal==='quiz' && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold" style={{ color:'#e2e8f0' }}>{demoContent.quiz.question}</p>
                      {demoContent.quiz.options.map((opt, i) => (
                        <div key={opt} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                          style={{ background:i===demoContent.quiz.correctIndex?'rgba(5,150,105,0.15)':'rgba(255,255,255,0.04)', border:i===demoContent.quiz.correctIndex?'1px solid rgba(5,150,105,0.40)':'1px solid rgba(255,255,255,0.07)', color:i===demoContent.quiz.correctIndex?'#34d399':'#94a3b8' }}>
                          <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ background:i===demoContent.quiz.correctIndex?'rgba(5,150,105,0.25)':'rgba(255,255,255,0.06)', color:i===demoContent.quiz.correctIndex?'#34d399':'#64748b' }}>
                            {['A','B','C','D'][i]}
                          </span>
                          <span className="text-sm flex-1">{opt}</span>
                          {i===demoContent.quiz.correctIndex&&<span className="text-xs font-bold" style={{ color:'#34d399' }}>✓</span>}
                        </div>
                      ))}
                      <p className="text-xs px-1" style={{ color:'#64748b' }}>💡 {demoContent.quiz.explanation}</p>
                    </div>
                  )}

                  {bentoModal==='flashcards' && (
                    <div className="space-y-4">
                      <p className="text-xs text-center" style={{ color:'#475569' }}>Klikni na kartu pro otočení</p>
                      <button onClick={() => setBentoFlipped(f=>!f)}
                        className="w-full h-32 rounded-2xl flex items-center justify-center p-6 transition-all"
                        style={{ background:bentoFlipped?'rgba(5,150,105,0.12)':'rgba(99,102,241,0.10)', border:bentoFlipped?'1px solid rgba(5,150,105,0.35)':'1px solid rgba(99,102,241,0.30)' }}>
                        <motion.p key={String(bentoFlipped)} initial={{ opacity:0, rotateY:90 }} animate={{ opacity:1, rotateY:0 }}
                          transition={{ duration:0.25 }} className="text-base font-bold text-center"
                          style={{ color:bentoFlipped?'#34d399':'#a78bfa' }}>
                          {bentoFlipped ? demoContent.flashcard.back : demoContent.flashcard.front}
                        </motion.p>
                      </button>
                      <p className="text-xs text-center" style={{ color:'#334155' }}>Pojem 1 z 10 · {bentoFlipped?'Definice — klikni zpět':'Klikni pro definici →'}</p>
                    </div>
                  )}

                  {bentoModal==='game' && (
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color:'#64748b' }}>Přiřaď pojmy k definicím:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {demoContent.gamePairs.map(([term, def]) => (
                          <div key={term} className="contents">
                            <div className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', color:'#a78bfa' }}>{term}</div>
                            <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>{def}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center" style={{ color:'#334155' }}>Generuj téma pro plnou hru ↑</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </div>

      <OnboardingTooltip />
    </div>
  )
}
