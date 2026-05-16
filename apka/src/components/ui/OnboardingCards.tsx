'use client'

import { motion } from 'framer-motion'

interface Props {
  saveTeacher: () => Promise<void>
  saveStudent:  () => Promise<void>
}

const FEATURES = {
  teacher: ['📋 Plány hodin', '🧠 Kvízy', '🎮 Skupinové aktivity', '💜 Inkluze SVP'],
  student: ['✨ Chytré výpisky', '🧩 Kvízy', '🎙 Podcast', '🔬 Research Lab'],
}

const card = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1 },
}

export function OnboardingCards({ saveTeacher, saveStudent }: Props) {
  return (
    <motion.div
      className="grid sm:grid-cols-2 gap-5"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
    >
      {/* Teacher card */}
      <motion.div variants={card} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <form action={saveTeacher} className="h-full">
          <button
            type="submit"
            className="w-full h-full text-left rounded-3xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 16px 48px rgba(99,102,241,0.12),inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#6366f1,#7c3aed)' }} />
            <div className="p-7 space-y-4">
              <div className="text-5xl">👨‍🏫</div>
              <div>
                <p className="text-xl font-bold text-slate-900">Jsem Učitel / Učitelka</p>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  Generuji plány hodin, kvízy a materiály.
                  Šetřím hodiny přípravy každý týden.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FEATURES.teacher.map(f => (
                  <span key={f} className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.08)', color: '#4f46e5' }}>{f}</span>
                ))}
              </div>
              <p className="text-sm font-semibold text-indigo-600">Vybrat →</p>
            </div>
          </button>
        </form>
      </motion.div>

      {/* Student card */}
      <motion.div variants={card} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <form action={saveStudent} className="h-full">
          <button
            type="submit"
            className="w-full h-full text-left rounded-3xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.99]"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 16px 48px rgba(168,85,247,0.12),inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#a855f7,#ec4899)' }} />
            <div className="p-7 space-y-4">
              <div className="text-5xl">🎓</div>
              <div>
                <p className="text-xl font-bold text-slate-900">Jsem Student / Studentka</p>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  Generuji chytré výpisky, interaktivní kvízy
                  a výukové podcasty. Učím se efektivněji.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FEATURES.student.map(f => (
                  <span key={f} className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(168,85,247,0.08)', color: '#7c3aed' }}>{f}</span>
                ))}
              </div>
              <p className="text-sm font-semibold text-violet-600">Vybrat →</p>
            </div>
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
