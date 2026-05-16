'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Flashcard } from '@/types'

interface Props {
  flashcards: Flashcard[]
}

// ── Single flipping card ───────────────────────────────────────────────────────

function Card({ card, index, total }: { card: Flashcard; index: number; total: number }) {
  const { t } = useLanguage()
  const fc = t.flashcards
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Counter */}
      <p className="text-xs font-semibold text-slate-400">
        {index + 1} {fc.of} {total}
      </p>

      {/* 3D card */}
      <div
        className="relative cursor-pointer select-none"
        style={{ width: '100%', maxWidth: 420, height: 240, perspective: 1000 }}
        onClick={() => setFlipped(f => !f)}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
        >
          {/* Front — Term */}
          <div
            className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 gap-3"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#a855f7 100%)',
              boxShadow: '0 20px 60px rgba(79,70,229,0.35),0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{fc.front}</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white text-center leading-tight">
              {card.term}
            </p>
            <span className="text-xs text-white/50 mt-2">{fc.clickToFlip}</span>
          </div>

          {/* Back — Definition */}
          <div
            className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-8 gap-3"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid rgba(99,102,241,0.25)',
              boxShadow: '0 20px 60px rgba(79,70,229,0.15),0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{fc.back}</span>
            <p className="text-lg sm:text-xl font-semibold text-slate-800 text-center leading-relaxed">
              {card.definition}
            </p>
            <p className="text-xs font-bold text-indigo-400 mt-1 bg-indigo-50 px-3 py-1 rounded-full">{card.term}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Full flashcard deck with navigation ───────────────────────────────────────

export function FlashcardGroup({ flashcards }: Props) {
  const { t } = useLanguage()
  const fc = t.flashcards
  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  if (!flashcards?.length) {
    return <p className="text-slate-400 text-sm text-center py-8">{fc.empty}</p>
  }

  const go = (dir: 1 | -1) => {
    setDirection(dir)
    setIdx(i => Math.max(0, Math.min(flashcards.length - 1, i + dir)))
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="space-y-6">
      {/* Card with slide animation */}
      <div style={{ overflow: 'hidden' }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={idx}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Card card={flashcards[idx]} index={idx} total={flashcards.length} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={idx === 0}
          className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.85)', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {fc.prev}
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i) }}
              className="rounded-full transition-all"
              style={{
                width:  i === idx ? 20 : 7,
                height: 7,
                background: i === idx ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(99,102,241,0.25)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          disabled={idx === flashcards.length - 1}
          className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
        >
          {fc.next}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)' }}
          animate={{ width: `${((idx + 1) / flashcards.length) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
