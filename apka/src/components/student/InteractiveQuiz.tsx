'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trophy, RotateCcw } from 'lucide-react'
import type { QuizQuestion } from '@/types'

interface Props {
  questions: QuizQuestion[]
}

const LETTERS = ['A', 'B', 'C', 'D'] as const

const SCORE_CONFIG = [
  { min: 5, emoji: '🏆', color: '#059669', label: 'Perfektní skóre!', msg: 'Zvládl(a) jsi to na výbornou. Jsi připraven(a).' },
  { min: 4, emoji: '⭐', color: '#4f46e5', label: 'Výborně!',         msg: 'Skoro perfektní. Zkontroluj jednu chybu a jsi ready.' },
  { min: 3, emoji: '👍', color: '#d97706', label: 'Dobrá práce',      msg: 'Základ zvládáš. Projdi si moduly k otázkám, kde sis nebyl(a) jistý(á).' },
  { min: 0, emoji: '📚', color: '#dc2626', label: 'Zkus to znovu',    msg: 'Projdi si výpisky ještě jednou a zkus kvíz znovu. Každý pokus tě posouvá.' },
]

function getScoreConfig(correct: number) {
  return SCORE_CONFIG.find(c => correct >= c.min) ?? SCORE_CONFIG[SCORE_CONFIG.length - 1]
}

// ── Single question card ───────────────────────────────────────────────────────

function QuestionCard({
  q, index, selected, onAnswer,
}: {
  q: QuizQuestion
  index: number
  selected: number | undefined
  onAnswer: (optIdx: number) => void
}) {
  const answered = selected !== undefined
  const isCorrect = selected === q.correct_index

  function optionStyle(oi: number): React.CSSProperties {
    if (!answered) {
      return {
        background: 'rgba(255,255,255,0.55)',
        border: '1.5px solid rgba(255,255,255,0.75)',
        cursor: 'pointer',
      }
    }
    if (oi === q.correct_index) {
      return {
        background: 'rgba(5,150,105,0.10)',
        border: '1.5px solid rgba(5,150,105,0.35)',
        cursor: 'default',
      }
    }
    if (oi === selected) {
      return {
        background: 'rgba(239,68,68,0.10)',
        border: '1.5px solid rgba(239,68,68,0.35)',
        cursor: 'default',
      }
    }
    return {
      background: 'rgba(255,255,255,0.25)',
      border: '1.5px solid rgba(255,255,255,0.4)',
      opacity: 0.55,
      cursor: 'default',
    }
  }

  function optionIcon(oi: number) {
    if (!answered) return null
    if (oi === q.correct_index) return <Check className="w-4 h-4 shrink-0" style={{ color: '#059669' }} />
    if (oi === selected) return <X className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: answered
          ? `1.5px solid ${isCorrect ? 'rgba(5,150,105,0.25)' : 'rgba(239,68,68,0.2)'}`
          : '1.5px solid rgba(255,255,255,0.88)',
        boxShadow: '0 4px 20px rgba(109,40,217,0.07)',
      }}
    >
      {/* Question header */}
      <div className="flex items-start gap-3 px-5 py-4">
        <span
          className="shrink-0 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center mt-0.5"
          style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
        >
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{q.question}</p>
      </div>

      {/* Options */}
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((opt, oi) => (
          <button
            key={oi}
            onClick={() => !answered && onAnswer(oi)}
            disabled={answered}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all"
            style={optionStyle(oi)}
          >
            <span
              className="shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center"
              style={{
                background: !answered
                  ? 'rgba(99,102,241,0.12)'
                  : oi === q.correct_index
                    ? 'rgba(5,150,105,0.18)'
                    : oi === selected
                      ? 'rgba(239,68,68,0.18)'
                      : 'rgba(0,0,0,0.05)',
                color: !answered ? '#6366f1' : oi === q.correct_index ? '#059669' : oi === selected ? '#dc2626' : '#94a3b8',
              }}
            >
              {LETTERS[oi]}
            </span>
            <span className="text-sm text-slate-700 flex-1 leading-snug">{opt}</span>
            {optionIcon(oi)}
          </button>
        ))}
      </div>

      {/* Explanation (revealed after answering) */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mx-4 mb-4 rounded-xl px-4 py-3"
              style={{
                background: isCorrect ? 'rgba(5,150,105,0.07)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${isCorrect ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.18)'}`,
              }}
            >
              {!isCorrect && (
                <p className="text-xs font-bold mb-1.5" style={{ color: '#dc2626' }}>
                  Zvolil(a) jsi {LETTERS[selected!]} — správně je {LETTERS[q.correct_index]}
                </p>
              )}
              <p className="text-sm leading-relaxed" style={{ color: isCorrect ? '#065f46' : '#7f1d1d' }}>
                💡 {q.explanation_why_correct}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main quiz component ────────────────────────────────────────────────────────

export function InteractiveQuiz({ questions }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const answered = Object.keys(answers).length
  const correct  = Object.entries(answers).filter(([qi, si]) => questions[+qi].correct_index === +si).length
  const allDone  = answered === questions.length

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (answers[qIdx] !== undefined) return
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const reset = () => setAnswers({})

  const scoreConf = getScoreConfig(correct)

  return (
    <div className="space-y-4">

      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">🧩 Kvíz</span>
          <span className="text-xs text-slate-500 bg-white/60 px-2.5 py-1 rounded-full border border-white/70">
            {answered}/{questions.length} zodpovězeno
          </span>
          {answered > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: correct === answered ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.08)',
                color: correct === answered ? '#059669' : '#dc2626',
                border: `1px solid ${correct === answered ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
              ✓ {correct} správně
            </span>
          )}
        </div>
        {answered > 0 && (
          <button onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />Resetovat
          </button>
        )}
      </div>

      {/* Progress track */}
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(109,40,217,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)' }}
          initial={{ width: 0 }}
          animate={{ width: `${(answered / questions.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <QuestionCard
          key={qi}
          q={q}
          index={qi}
          selected={answers[qi]}
          onAnswer={oi => handleAnswer(qi, oi)}
        />
      ))}

      {/* Final score card */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="rounded-2xl overflow-hidden"
            style={{ padding: '2px', background: `linear-gradient(135deg,${scoreConf.color},#a855f7)` }}
          >
            <div className="rounded-[14px] px-6 py-5 text-center space-y-2"
              style={{ background: 'rgba(255,255,255,0.92)' }}>
              <div className="text-4xl">{scoreConf.emoji}</div>
              <div>
                <p className="text-lg font-extrabold" style={{ color: scoreConf.color }}>{scoreConf.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{correct} / {questions.length}</p>
              </div>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">{scoreConf.msg}</p>
              <button
                onClick={reset}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ background: `${scoreConf.color}15`, color: scoreConf.color, border: `1px solid ${scoreConf.color}30` }}
              >
                <RotateCcw className="w-3.5 h-3.5" />Zkusit znovu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
