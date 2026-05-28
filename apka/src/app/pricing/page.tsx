'use client'

import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// ── Animation variants ────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1,  y: 0,  transition: { duration: 0.55, ease: 'easeOut' as const } },
}

// ── Tier card ─────────────────────────────────────────────────────────────────

interface Tier {
  name:     string
  badge:    string
  desc:     string
  price:    string
  period:   string
  cta:      string
  features: readonly string[]
  isPro?:   boolean
  isFree?:  boolean
}

function TierCard({ tier, onPay }: { tier: Tier; onPay: () => void }) {
  const accent     = tier.isPro ? '#4f46e5' : tier.isFree ? '#64748b' : '#0891b2'
  const badgeBg    = tier.isPro
    ? 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)'
    : tier.isFree
    ? 'rgba(100,116,139,0.1)'
    : 'rgba(8,145,178,0.1)'
  const badgeColor = tier.isPro ? '#fff' : tier.isFree ? '#64748b' : '#0891b2'

  const card = (
    <div className="rounded-3xl p-8 flex flex-col gap-6 h-full"
      style={{
        background:  tier.isPro ? 'rgba(248,245,255,0.97)' : 'rgba(255,255,255,0.82)',
        boxShadow:   tier.isPro
          ? '0 24px 64px rgba(79,46,220,0.20),0 8px 24px rgba(0,0,0,0.08)'
          : '0 8px 32px rgba(0,0,0,0.06)',
      }}>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-extrabold text-slate-900">{tier.name}</h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: badgeBg, color: badgeColor }}>
            {tier.badge}
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{tier.desc}</p>
      </div>

      {/* Price */}
      <div className="flex items-end gap-1">
        <span className="text-4xl font-black text-slate-900">{tier.price}</span>
        {tier.period && <span className="text-slate-400 text-sm mb-1">{tier.period}</span>}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onPay}
        disabled={tier.isFree}
        className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:cursor-default"
        style={tier.isFree ? {
          background: 'rgba(100,116,139,0.08)',
          color: '#94a3b8',
        } : tier.isPro ? {
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(79,46,220,0.35)',
        } : {
          background: 'rgba(8,145,178,0.10)',
          color: '#0891b2',
          border: '1.5px solid rgba(8,145,178,0.25)',
        }}>
        {tier.cta}
      </button>
    </div>
  )

  if (tier.isPro) {
    return (
      <div style={{ padding: '2px', borderRadius: '26px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7,#ec4899)' }}>
        {card}
      </div>
    )
  }

  return (
    <div style={{ border: '1.5px solid rgba(226,232,240,0.8)', borderRadius: '26px', overflow: 'hidden' }}>
      {card}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { t } = useLanguage()
  const p = t.pricing

  function handlePay() {
    toast('Brzy dostupné!', {
      description: 'Platby spustíme v nejbližší době. Zůstaň naladěn!',
      duration: 5000,
    })
  }

  const tiers: Tier[] = [
    { ...p.free,    isFree: true },
    { ...p.pro,     isPro:  true },
    { ...p.credits,             },
  ]

  return (
    <div className="space-y-12 py-4">

      {/* ── Hero ── */}
      <motion.div
        className="text-center space-y-5"
        initial="hidden" animate="show" variants={container}
      >
        <motion.div className="flex justify-center" variants={fadeUp}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 16px 48px rgba(79,46,220,0.30)' }}>
            <Zap className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {p.heroTitle}
          </h1>
          <p className="text-slate-500 text-lg mt-3 max-w-xl mx-auto leading-relaxed">
            {p.heroSubtitle}
          </p>
        </motion.div>
      </motion.div>

      {/* ── Tiers grid ── */}
      <motion.div
        className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto"
        initial="hidden" animate="show" variants={container}
      >
        {tiers.map((tier) => (
          <motion.div key={tier.name} variants={fadeUp} className="flex flex-col">
            <TierCard tier={tier} onPay={handlePay} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Trust strip ── */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        <p className="text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
          <span>🔒 Bezpečná platba</span>
          <span>✦</span>
          <span>✓ Zrušit kdykoliv</span>
          <span>✦</span>
          <span>🇨🇿 Provozováno v ČR</span>
        </p>
      </motion.div>

    </div>
  )
}
