'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMaterials, deleteMaterial, type SavedMaterial } from '@/lib/actions/materials'

const SUBJECT_COLORS: Record<string, string> = {
  history: 'bg-amber-100 text-amber-800 border-amber-200',
  math: 'bg-blue-100 text-blue-800 border-blue-200',
  physics: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  biology: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  chemistry: 'bg-lime-100 text-lime-800 border-lime-200',
  literature: 'bg-rose-100 text-rose-800 border-rose-200',
  geography: 'bg-teal-100 text-teal-800 border-teal-200',
  civics: 'bg-violet-100 text-violet-800 border-violet-200',
  general: 'bg-slate-100 text-slate-700 border-slate-200',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

function MaterialCard({ item, onDelete }: { item: SavedMaterial; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const badgeClass = SUBJECT_COLORS[item.subject] ?? SUBJECT_COLORS.general

  const handleDelete = async () => {
    setDeleting(true)
    await deleteMaterial(item.id)
    onDelete()
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
              {item.subject_label}
            </span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{item.grade}</span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{item.duration} min</span>
          </div>
          <h3 className="font-semibold text-slate-900 text-base truncate">{item.topic}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            {expanded ? 'Skrýt ↑' : 'Zobrazit ↓'}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-slate-100 px-5 py-4 space-y-4">
              {/* Lesson plan */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📋 Plán hodiny</h4>
                <div className="space-y-2">
                  {(['uvod', 'aktivizace', 'hlavniCast', 'shrnuti'] as const).map((key) => {
                    const labels = { uvod: 'Úvod', aktivizace: 'Aktivizace', hlavniCast: 'Hlavní část', shrnuti: 'Shrnutí' }
                    return (
                      <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{labels[key]}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{item.lesson_plan[key]}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quiz */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🧠 Kvíz</h4>
                <ol className="space-y-2">
                  {item.quiz.map((q, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-sm font-medium text-slate-800">{i + 1}. {q.question}</p>
                      <p className="text-xs text-emerald-700 mt-1">💡 {q.answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ProfilPage() {
  const [materials, setMaterials] = useState<SavedMaterial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMaterials().then(d => { setMaterials(d); setLoading(false) })
  }, [])

  const remove = (id: string) => setMaterials(m => m.filter(x => x.id !== id))

  // Stats
  const subjectCounts = materials.reduce<Record<string, number>>((acc, m) => {
    acc[m.subject_label] = (acc[m.subject_label] ?? 0) + 1
    return acc
  }, {})
  const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Můj profil</h1>
        <p className="text-slate-500 text-sm mt-1">Historie vygenerovaných materiálů</p>
      </div>

      {/* Stats */}
      {materials.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Celkem vygenerováno', value: materials.length, icon: '📋' },
            { label: 'Nejčastější předmět', value: topSubject?.[0] ?? '–', icon: '🏆' },
            { label: 'Různých témat', value: new Set(materials.map(m => m.topic)).size, icon: '✨' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[0,1,2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <p className="text-4xl mb-3">📂</p>
          <p className="text-slate-700 font-medium">Zatím žádné materiály</p>
          <p className="text-slate-400 text-sm mt-1">Vygenerujte svůj první plán hodiny v sekci Generátor.</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {materials.map(m => (
              <MaterialCard key={m.id} item={m} onDelete={() => remove(m.id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
