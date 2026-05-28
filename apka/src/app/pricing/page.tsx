'use client'

import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { PublicShell } from '@/components/ui/PublicShell'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
}

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
  const checkColor = tier.isPro ? '#a78bfa' : '#6366f1'

  const card = (
    <div style={{
      background: tier.isPro ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
      borderRadius: 22, padding: '32px 28px',
      display: 'flex', flexDirection: 'column', gap: 24, height: '100%',
      boxShadow: tier.isPro ? '0 24px 64px rgba(124,58,237,0.20)' : '0 4px 24px rgba(0,0,0,0.30)',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>{tier.name}</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 220 }}>{tier.desc}</p>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, flexShrink: 0,
          background: tier.isPro
            ? 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)'
            : 'rgba(255,255,255,0.06)',
          color: tier.isPro ? '#fff' : '#64748b',
        }}>{tier.badge}</span>
      </div>

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span style={{
          fontSize: 40, fontWeight: 900, lineHeight: 1,
          color: tier.isPro ? '#a78bfa' : '#f1f5f9',
        }}>{tier.price}</span>
        {tier.period && (
          <span style={{ fontSize: 13, color: '#64748b', paddingBottom: 4 }}>{tier.period}</span>
        )}
      </div>

      {/* Features */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, margin: 0, padding: 0, listStyle: 'none' }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
            <Check style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, color: checkColor }} strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onPay}
        disabled={tier.isFree}
        style={tier.isFree ? {
          width: '100%', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 700,
          background: 'rgba(255,255,255,0.04)', color: '#475569',
          border: '1px solid rgba(255,255,255,0.07)', cursor: 'default',
        } : tier.isPro ? {
          width: '100%', padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff',
          border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.45)',
          transition: 'all 0.15s',
        } : {
          width: '100%', padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 700,
          background: 'rgba(99,102,241,0.10)', color: '#818cf8',
          border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {tier.cta}
      </button>
    </div>
  )

  if (tier.isPro) {
    return (
      <div style={{ padding: 2, borderRadius: 26, background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7,#ec4899)', height: '100%' }}>
        {card}
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, overflow: 'hidden', height: '100%' }}>
      {card}
    </div>
  )
}

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
    <PublicShell>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 100px' }}>

        {/* Hero */}
        <motion.div style={{ textAlign: 'center', marginBottom: 60 }} initial="hidden" animate="show" variants={container}>
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(124,58,237,0.40)' }}>
              <Zap style={{ width: 32, height: 32, color: '#fff' }} strokeWidth={1.5} />
            </div>
          </motion.div>
          <motion.div variants={fadeUp}>
            <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
              {p.heroTitle}
            </h1>
            <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 480, margin: '0 auto', lineHeight: 1.68 }}>
              {p.heroSubtitle}
            </p>
          </motion.div>
        </motion.div>

        {/* Tier grid */}
        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'stretch', maxWidth: 960, margin: '0 auto 48px' }}
          initial="hidden" animate="show" variants={container}
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column' }}>
              <TierCard tier={tier} onPay={handlePay} />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.p
          style={{ textAlign: 'center', fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', margin: 0 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          <span>🔒 Bezpečná platba</span>
          <span>✦</span>
          <span>✓ Zrušit kdykoliv</span>
          <span>✦</span>
          <span>🇨🇿 Provozováno v ČR</span>
        </motion.p>

      </div>
    </PublicShell>
  )
}
