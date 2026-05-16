'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateStreak } from '@/lib/actions/streak'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// Localised "days" suffix per language
const DAYS: Record<string, string> = {
  cz: 'dní', en: 'days', de: 'Tage', fr: 'jours',
}

export function StreakBadge() {
  const { lang } = useLanguage()
  const [streak, setStreak] = useState(0)
  const [popped, setPopped] = useState(false)  // celebrate when streak increases

  useEffect(() => {
    updateStreak()
      .then(n => {
        if (n > 0) {
          setStreak(prev => {
            if (n > prev && prev > 0) setPopped(true)
            return n
          })
        }
      })
      .catch(() => {})
  }, [])

  // Brief celebration pop when streak ticks up
  useEffect(() => {
    if (!popped) return
    const id = setTimeout(() => setPopped(false), 1200)
    return () => clearTimeout(id)
  }, [popped])

  if (streak === 0) return null   // hide until streak data arrives

  return (
    <AnimatePresence>
      <motion.div
        key="streak"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: popped ? [1, 1.25, 1] : 1 }}
        transition={{ duration: popped ? 0.4 : 0.25, ease: 'easeOut' }}
        title={`${streak} ${DAYS[lang] ?? 'dní'} v řadě`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-default select-none"
        style={{
          background:  'rgba(239,68,68,0.08)',
          border:      '1.5px solid rgba(239,68,68,0.20)',
        }}
      >
        <motion.span
          animate={popped
            ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }
            : { scale: [1, 1.18, 1] }
          }
          transition={popped
            ? { duration: 0.4 }
            : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          }
          className="text-base leading-none"
        >
          🔥
        </motion.span>
        <span className="text-sm font-extrabold" style={{ color: '#dc2626' }}>
          {streak}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>
          {DAYS[lang] ?? 'dní'}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
