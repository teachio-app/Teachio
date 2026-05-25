'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStudentNotes, deleteStudentNote, type SavedStudentNote } from '@/lib/actions/materials'
import { useLanguage } from '@/lib/i18n/LanguageContext'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

const LEVEL_STYLE: Record<string, string> = {
  ZŠ: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SŠ: 'bg-blue-50 text-blue-700 border-blue-200',
  VŠ: 'bg-violet-50 text-violet-700 border-violet-200',
}

function FileCard({ item, onDelete }: { item: SavedStudentNote; onDelete: () => void }) {
  const [tab,      setTab]      = useState<'notes' | 'text'>('notes')
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const n = item.notes_data
  const hasText = !!item.raw_text

  const handleDelete = async () => {
    setDeleting(true)
    await deleteStudentNote(item.id)
    onDelete()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(109,40,217,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
              {hasText ? '📄 Z dokumentu' : '✨ Z tématu'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${LEVEL_STYLE[item.level] ?? LEVEL_STYLE.SŠ}`}>
              {item.level}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base leading-snug">{item.topic}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-violet-200 text-indigo-600 bg-violet-50 hover:bg-violet-100 transition-all"
          >
            {expanded ? 'Zavřít ↑' : 'Zobrazit ↓'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(226,232,240,0.7)' }}>

              {/* Tab switcher — only shown when raw text exists */}
              {hasText && (
                <div className="flex gap-1 px-5 pt-4">
                  {(['notes', 'text'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={tab === t
                        ? { background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white' }
                        : { background: 'rgba(99,102,241,0.07)', color: '#6366f1' }
                      }
                    >
                      {t === 'notes' ? '🧠 Zápisky' : '📄 Text souboru'}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-5 py-4 space-y-4">

                {/* Notes tab */}
                {(!hasText || tab === 'notes') && (
                  <>
                    {n?.introduction && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">📌 Úvod</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{n.introduction}</p>
                      </div>
                    )}
                    {n?.tl_dr && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">⚡ TL;DR</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{n.tl_dr}</p>
                      </div>
                    )}
                    {n?.deep_modules && n.deep_modules.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📚 Klíčové koncepty</p>
                        <div className="space-y-2">
                          {n.deep_modules.map((m, i) => (
                            <div key={i} className="rounded-xl px-4 py-3" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.10)' }}>
                              <p className="text-sm font-bold text-indigo-800">{m.title}</p>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.explanation}</p>
                              {m.analogy && <p className="text-xs text-violet-600 mt-1.5 italic">💡 {m.analogy}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {n?.exam_traps && n.exam_traps.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">⚠️ Chytáky</p>
                        <div className="space-y-1.5">
                          {n.exam_traps.map((trap, i) => (
                            <p key={i} className="text-xs text-slate-700 leading-relaxed rounded-xl px-3 py-2" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
                              {trap}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {n?.memory_hack && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">🧠 Mnemotechnika</p>
                        <p className="text-sm text-slate-700 leading-relaxed rounded-xl px-3 py-2" style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.12)' }}>
                          {n.memory_hack}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Raw text tab */}
                {hasText && tab === 'text' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Původní text dokumentu</p>
                      <span className="text-xs text-slate-400">{item.raw_text!.length.toLocaleString()} znaků</span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap overflow-auto"
                      style={{ background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.08)', maxHeight: '400px' }}
                    >
                      {item.raw_text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FilesPage() {
  const { t } = useLanguage()
  const [notes,   setNotes]   = useState<SavedStudentNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentNotes().then(n => { setNotes(n); setLoading(false) })
  }, [])

  const remove = (id: string) => setNotes(n => n.filter(x => x.id !== id))

  const fromDocs  = notes.filter(n => n.raw_text)
  const fromTopic = notes.filter(n => !n.raw_text)

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t.nav.files}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? '…' : `${notes.length} záznamů — dokumenty i zápisky z témat`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)' }} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px dashed rgba(99,102,241,0.25)' }}>
          <p className="text-5xl mb-4">📂</p>
          <p className="font-bold text-slate-800 text-lg">Zatím žádné soubory</p>
          <p className="text-slate-400 text-sm mt-1">Nahrajte PDF nebo zadejte téma — vše se uloží sem automaticky.</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Documents */}
          {fromDocs.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <span className="text-base">📄</span> Z nahraných dokumentů
                <span className="ml-auto font-normal normal-case text-slate-400">{fromDocs.length} souborů</span>
              </h2>
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {fromDocs.map(n => <FileCard key={n.id} item={n} onDelete={() => remove(n.id)} />)}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* Topic-based */}
          {fromTopic.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <span className="text-base">✨</span> Ze zadaných témat
                <span className="ml-auto font-normal normal-case text-slate-400">{fromTopic.length} záznamů</span>
              </h2>
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {fromTopic.map(n => <FileCard key={n.id} item={n} onDelete={() => remove(n.id)} />)}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
