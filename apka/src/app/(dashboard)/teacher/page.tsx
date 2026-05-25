'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap, Users, BookOpen, Clock, Layers, Heart } from 'lucide-react'
import GeneratorForm from '@/components/forms/GeneratorForm'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}
const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

export default function TeacherPage() {
  const { t } = useLanguage()
  const tt = t.teacher

  const BENTO = [
    {
      icon: '⚡',
      label: 'E-U-R Framework',
      desc: 'Evokace, Uvědomění, Reflexe — moderní pedagogika v každém plánu',
      accent: '#3b82f6',
      bg: 'rgba(37,99,235,0.08)',
      border: 'rgba(37,99,235,0.18)',
    },
    {
      icon: '📄',
      label: 'SVG Pracovní listy',
      desc: 'Připravené k tisku — matching cvičení, otázky, kreativní úkoly',
      accent: '#06b6d4',
      bg: 'rgba(6,182,212,0.07)',
      border: 'rgba(6,182,212,0.16)',
    },
    {
      icon: '👥',
      label: 'Skupinové aktivity',
      desc: 'Role-playing, debaty, projekty přizpůsobené třídě',
      accent: '#6366f1',
      bg: 'rgba(99,102,241,0.08)',
      border: 'rgba(99,102,241,0.18)',
    },
    {
      icon: '♿',
      label: 'Inkluze SEN',
      desc: 'Adaptace pro studenty se speciálními vzdělávacími potřebami',
      accent: '#10b981',
      bg: 'rgba(16,185,129,0.07)',
      border: 'rgba(16,185,129,0.16)',
    },
    {
      icon: '🧩',
      label: 'Kvíz & Hra',
      desc: '5 testovacích otázek + interaktivní minihra na každé téma',
      accent: '#a855f7',
      bg: 'rgba(168,85,247,0.07)',
      border: 'rgba(168,85,247,0.16)',
    },
    {
      icon: '🗺️',
      label: 'Mind Mapa',
      desc: 'Automaticky generovaná vizuální mapa klíčových pojmů',
      accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.16)',
    },
  ]

  return (
    // Full-bleed: 100vw calc trick — layout.tsx provides dark background
    <div
      className="-mt-10 -mb-10 relative"
      style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', minHeight: '100vh' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* ── Hero ── */}
        <motion.div
          className="text-center space-y-4"
          initial="hidden" animate="show" variants={container}
        >
          {/* Icon */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#3b82f6,#06b6d4)',
                boxShadow: '0 0 40px rgba(37,99,235,0.40)',
              }}
            >
              <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
              style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.22)', color: '#93c5fd' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
              Teacher Arsenal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 50%,#93c5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {tt.pageTitle}
            </h1>
            <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: '#64748b' }}>
              {tt.pageSubtitle}
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={fadeUp} className="flex justify-center gap-6 pt-2">
            {[
              { icon: '⚡', label: 'Celý Arsenal', sub: '8–12 min' },
              { icon: '📋', label: 'E-U-R + Worksheet', sub: 'ihned' },
              { icon: '🧠', label: 'Kvíz + Minihra', sub: 'každé téma' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{s.label}</p>
                <p className="text-xs" style={{ color: '#475569' }}>{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Generator Form — core functionality ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GeneratorForm />
        </motion.div>

        {/* ── Bento grid — feature showcase ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
            Co vygeneruješ v každém plánu
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BENTO.map(b => (
              <motion.div
                key={b.label}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                className="rounded-2xl p-4 space-y-2"
                style={{ background: b.bg, border: `1px solid ${b.border}` }}
              >
                <span className="text-2xl">{b.icon}</span>
                <p className="text-sm font-bold" style={{ color: b.accent }}>{b.label}</p>
                <p className="text-xs leading-snug" style={{ color: '#64748b' }}>{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
