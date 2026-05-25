'use client'

import { useState, useMemo } from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { InteractiveGame as GameData, SortingItem, GameMatchingPair } from '@/types'

interface Props { game: GameData }

// ── Utility ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Sorting Game ───────────────────────────────────────────────────────────────

function SortingGame({ game }: { game: GameData }) {
  const { t } = useLanguage()
  const g = t.game
  const correctItems = game.items as SortingItem[]

  const [items,   setItems]   = useState<SortingItem[]>(() => shuffle([...correctItems]))
  const [checked, setChecked] = useState(false)

  const allCorrect = useMemo(
    () => checked && items.every((item, i) => item.id === correctItems[i].id),
    [checked, items, correctItems]
  )

  function itemState(item: SortingItem, idx: number): 'correct' | 'wrong' | 'idle' {
    if (!checked) return 'idle'
    return item.id === correctItems[idx].id ? 'correct' : 'wrong'
  }

  function reset() {
    setChecked(false)
    setItems(shuffle([...correctItems]))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <span>↕</span>{g.sortingHint}
      </p>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        {items.map((item, idx) => {
          const state = itemState(item, idx)
          return (
            <Reorder.Item
              key={item.id}
              value={item}
              className="select-none cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(99,102,241,0.22)', zIndex: 50 }}
            >
              <motion.div
                animate={
                  state === 'wrong'
                    ? { x: [-6, 6, -6, 6, 0], backgroundColor: '#fee2e2' }
                    : state === 'correct'
                    ? { backgroundColor: '#dcfce7' }
                    : { backgroundColor: 'rgba(255,255,255,0.75)' }
                }
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-slate-800"
                style={{
                  border: state === 'correct'
                    ? '1.5px solid rgba(34,197,94,0.4)'
                    : state === 'wrong'
                    ? '1.5px solid rgba(239,68,68,0.4)'
                    : '1.5px solid rgba(226,232,240,0.8)',
                }}
              >
                {/* drag handle */}
                <span className="text-slate-300 select-none text-base leading-none shrink-0">⠿</span>
                <span className="flex-1">{item.text}</span>
                {state === 'correct' && <span className="text-emerald-500 text-base shrink-0">✓</span>}
                {state === 'wrong'   && <span className="text-red-400 text-base shrink-0">✗</span>}
              </motion.div>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>

      <AnimatePresence>
        {checked && (
          <motion.p
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`text-sm font-semibold text-center py-2 rounded-xl ${allCorrect ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}
          >
            {allCorrect ? g.congratsAll : g.tryAgain}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-2 justify-center">
        {!allCorrect && (
          <button
            onClick={() => setChecked(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 12px rgba(99,102,241,0.30)' }}
          >
            {g.checkBtn}
          </button>
        )}
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white/70 hover:bg-slate-50 transition-all"
        >
          {g.resetBtn}
        </button>
      </div>
    </div>
  )
}

// ── Matching Game ──────────────────────────────────────────────────────────────

function MatchingGame({ game }: { game: GameData }) {
  const { t } = useLanguage()
  const g = t.game

  // Deduplicate pairs by left value so no term appears twice on the left
  const pairs = useMemo(() => {
    const seen = new Set<string>()
    return (game.items as GameMatchingPair[]).filter(p => {
      if (seen.has(p.left)) return false
      seen.add(p.left)
      return true
    })
  }, [game.items])

  const [shuffledRight, setShuffledRight] = useState<string[]>(() => shuffle(pairs.map(p => p.right)))
  const rightToLeft = useMemo(
    () => shuffledRight.map(rt => pairs.findIndex(p => p.right === rt)),
    [shuffledRight, pairs]
  )

  const [selectedLeft,  setSelectedLeft]  = useState<number | null>(null)
  const [matched,       setMatched]       = useState<Set<number>>(new Set())
  const [wrongLeft,     setWrongLeft]     = useState<number | null>(null)
  const [wrongRight,    setWrongRight]    = useState<number | null>(null)

  const allDone = matched.size === pairs.length

  function isLeftMatched(li: number)  { return matched.has(li) }
  function isRightMatched(ri: number) { return matched.has(rightToLeft[ri]) }

  function handleLeft(li: number) {
    if (isLeftMatched(li) || wrongLeft !== null) return
    setSelectedLeft(li === selectedLeft ? null : li)
  }

  function handleRight(ri: number) {
    if (isRightMatched(ri) || selectedLeft === null || wrongLeft !== null) return
    if (rightToLeft[ri] === selectedLeft) {
      setMatched(prev => new Set([...prev, selectedLeft]))
      setSelectedLeft(null)
    } else {
      setWrongLeft(selectedLeft)
      setWrongRight(ri)
      setTimeout(() => {
        setWrongLeft(null)
        setWrongRight(null)
        setSelectedLeft(null)
      }, 700)
    }
  }

  function reset() {
    setSelectedLeft(null)
    setMatched(new Set())
    setWrongLeft(null)
    setWrongRight(null)
    // Reshuffle right column so positions change on every replay
    setShuffledRight(shuffle(pairs.map(p => p.right)))
  }

  function colButton(
    label: string,
    isSelected: boolean,
    isMatched: boolean,
    isWrong: boolean,
    onClick: () => void
  ) {
    const bg = isMatched  ? 'rgba(220,252,231,0.9)'
             : isWrong    ? 'rgba(254,226,226,0.9)'
             : isSelected ? 'rgba(238,242,255,0.9)'
             : 'rgba(255,255,255,0.75)'
    const border = isMatched  ? 'rgba(34,197,94,0.45)'
                 : isWrong    ? 'rgba(239,68,68,0.45)'
                 : isSelected ? 'rgba(99,102,241,0.5)'
                 : 'rgba(226,232,240,0.8)'
    const color  = isMatched  ? '#15803d'
                 : isWrong    ? '#dc2626'
                 : isSelected ? '#4f46e5'
                 : '#374151'

    return (
      <motion.button
        onClick={onClick}
        disabled={isMatched}
        animate={isWrong ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={!isMatched ? { scale: 1.02 } : {}}
        whileTap={!isMatched ? { scale: 0.98 } : {}}
        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ background: bg, border: `1.5px solid ${border}`, color, cursor: isMatched ? 'default' : 'pointer' }}
      >
        {isMatched && <span className="mr-1.5">✓</span>}
        {label}
      </motion.button>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{g.matchingHint}</p>

      <div className="grid grid-cols-2 gap-2">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, li) => colButton(
            pair.left,
            selectedLeft === li,
            isLeftMatched(li),
            wrongLeft === li,
            () => handleLeft(li)
          ))}
        </div>
        {/* Right column (shuffled) */}
        <div className="space-y-2">
          {shuffledRight.map((rt, ri) => colButton(
            rt,
            false,
            isRightMatched(ri),
            wrongRight === ri,
            () => handleRight(ri)
          ))}
        </div>
      </div>

      <AnimatePresence>
        {allDone && (
          <motion.p
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-center py-2 rounded-xl text-emerald-700 bg-emerald-50"
          >
            {g.allMatched}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex justify-center">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white/70 hover:bg-slate-50 transition-all"
        >
          {g.resetBtn}
        </button>
      </div>
    </div>
  )
}

// ── Shell component ────────────────────────────────────────────────────────────

export function InteractiveGame({ game }: Props) {
  if (!game?.game_type || !Array.isArray(game.items) || game.items.length === 0) return null

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-bold text-slate-900">{game.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{game.instructions}</p>
      </div>
      {game.game_type === 'sorting'
        ? <SortingGame  game={game} />
        : <MatchingGame game={game} />}
    </div>
  )
}
