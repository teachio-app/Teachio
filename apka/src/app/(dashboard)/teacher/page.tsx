'use client'

import { motion } from 'framer-motion'
import { Sparkles, GraduationCap, Clock, Layers, BookOpen, Users, Heart } from 'lucide-react'
import GeneratorForm from '@/components/forms/GeneratorForm'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1,  y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function TeacherPage() {
  // This call is critical — without it, text never re-renders when lang changes
  const { t } = useLanguage()
  const tt = t.teacher

  // Badge data lives INSIDE the component so it reads the current `t` on every render
  const BADGES = [
    { icon: GraduationCap, label: 'E-U-R Framework',    sub: t.common.minutes !== 'minut' ? 'Modern pedagogy' : 'moderní pedagogika' },
    { icon: Layers,        label: tt.tabs.eur,           sub: tt.arsenalBadge },
    { icon: Users,         label: tt.arsenal.groupActivity, sub: tt.arsenal.groupActivitySub },
    { icon: Heart,         label: tt.arsenal.senTitle,   sub: tt.arsenal.senSub },
    { icon: BookOpen,      label: tt.tabs.worksheet,     sub: tt.arsenal.ws.aiNote },
    { icon: Clock,         label: '8–12 ' + t.common.minutes, sub: tt.aiGenerated },
  ]

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <motion.div
        className="text-center space-y-6 pt-4 pb-2"
        initial="hidden" animate="show" variants={container}
      >
        <motion.div className="flex justify-center" variants={fadeUp}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)',
              boxShadow: '0 20px 60px rgba(109,40,217,0.35),0 4px 16px rgba(0,0,0,0.12)',
            }}>
            <Sparkles className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div className="space-y-3" variants={fadeUp}>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight gradient-text leading-tight">
            {tt.pageTitle}
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {tt.pageSubtitle}
          </p>
        </motion.div>

        <motion.div className="flex flex-wrap justify-center gap-3" variants={container}>
          {BADGES.map(({ icon: Icon, label, sub }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 16px rgba(109,40,217,0.08)',
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>
                <Icon className="w-3.5 h-3.5 text-indigo-600" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">{sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <GeneratorForm />
    </div>
  )
}
