'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProfile } from '@/lib/actions/credits'

interface Props {
  initialCredits: number
  initialIsPro: boolean
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ credits, onClose }: { credits: number; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: 'rgba(15,12,41,0.65)', backdropFilter: 'blur(4px)' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1.5px solid rgba(255,255,255,0.95)',
          boxShadow: '0 32px 80px rgba(109,40,217,0.22), 0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Gradient top bar */}
        <div className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#a855f7,#6366f1)', backgroundSize: '200%' }} />

        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)' }}>
              <span className="text-4xl">💎</span>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Vyčerpali jste volné kredity
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Zdarma dostanete <strong className="text-slate-700">3 generování</strong>. Pro neomezené
              generování materiálů a pokročilé funkce přejděte na <strong className="text-indigo-700">Teachio Pro</strong>.
            </p>
          </div>

          {/* Credit counter */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {credits} kreditů zbývá
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => alert('Platební systém bude brzy k dispozici. Děkujeme za zájem o Teachio Pro!')}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)', boxShadow: '0 8px 24px rgba(109,40,217,0.3)' }}>
              ⭐ Upgradovat na Pro
            </button>
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all text-sm">
              Zavřít
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Žádné skryté poplatky · Kdykoli zrušte
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Credit Badge + Portal for Modal ──────────────────────────────────────────

export function CreditSystem({ initialCredits, initialIsPro }: Props) {
  const [credits,   setCredits]   = useState(initialCredits)
  const [isPro,     setIsPro]     = useState(initialIsPro)
  const [showModal, setShowModal] = useState(false)

  const refresh = useCallback(async () => {
    const profile = await getProfile()
    if (profile) { setCredits(profile.credits); setIsPro(profile.is_pro) }
  }, [])

  useEffect(() => {
    const onUpdate    = () => refresh()
    const onOpenModal = () => setShowModal(true)

    window.addEventListener('credits-updated', onUpdate)
    window.addEventListener('upgrade-modal-open', onOpenModal)
    return () => {
      window.removeEventListener('credits-updated', onUpdate)
      window.removeEventListener('upgrade-modal-open', onOpenModal)
    }
  }, [refresh])

  // Badge colour based on credit level
  const badgeStyle = isPro
    ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none' }
    : credits > 1
      ? { background: 'rgba(99,102,241,0.1)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.2)' }
      : credits === 1
        ? { background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }
        : { background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => !isPro && setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
        style={badgeStyle}
        title={isPro ? 'Teachio Pro — neomezené generování' : `${credits} volných kreditů zbývá`}
      >
        {isPro ? (
          <><span>⭐</span> Pro</>
        ) : (
          <><span>💎</span> {credits} {credits === 1 ? 'kredit' : credits < 5 ? 'kredity' : 'kreditů'}</>
        )}
      </button>

      {/* Modal — rendered at component root to avoid stacking context issues */}
      <AnimatePresence>
        {showModal && (
          <UpgradeModal credits={credits} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
