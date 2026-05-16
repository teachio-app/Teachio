'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Mic2, RotateCcw, Radio } from 'lucide-react'
import type { PodcastTurn } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  podcast_script: PodcastTurn[]
}

interface PlayableTurn {
  speaker: PodcastTurn['speaker']
  text: string
  url: string          // blob URL created from base64
}

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error'

// ── Speaker config ─────────────────────────────────────────────────────────────

const SPEAKERS = {
  teacher: {
    emoji:  '👩‍🏫',
    label:  'Učitelka',
    color:  '#db2777',
    bg:     'rgba(219,39,119,0.10)',
    border: 'rgba(219,39,119,0.30)',
    wave:   'linear-gradient(to top,#db2777,#f472b6)',
  },
  student: {
    emoji:  '👨‍🎓',
    label:  'Student',
    color:  '#6366f1',
    bg:     'rgba(99,102,241,0.10)',
    border: 'rgba(99,102,241,0.30)',
    wave:   'linear-gradient(to top,#6366f1,#a78bfa)',
  },
} as const

// ── Animated waveform ──────────────────────────────────────────────────────────

// Asymmetric bar heights for a more organic, realistic waveform look
const BAR_HEIGHTS = [6, 14, 9, 24, 11, 20, 7, 28, 13, 18, 22, 10, 26, 8, 19, 15, 25, 9, 21, 12, 17, 7, 23, 11]

function Waveform({ isPlaying, speaker }: { isPlaying: boolean; speaker: PodcastTurn['speaker'] }) {
  const conf = SPEAKERS[speaker]
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: '32px' }}>
      {BAR_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: conf.wave }}
          animate={isPlaying
            ? {
                scaleY: [0.2, 1, 0.35, 0.8, 0.15, 1, 0.5],
                opacity: [0.7, 1, 0.8, 1, 0.6, 1, 0.9],
              }
            : { scaleY: 0.12, opacity: 0.35 }
          }
          initial={{ scaleY: 0.12, originY: 1 }}
          style={{ background: conf.wave, originY: 1, height: `${h}px` }}
          transition={{
            duration: 0.6 + (i % 5) * 0.11,
            repeat: isPlaying ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.035,
          }}
        />
      ))}
    </div>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PodcastPlayer({ podcast_script }: Props) {
  const [status,      setStatus]      = useState<PlayerStatus>('idle')
  const [turns,       setTurns]       = useState<PlayableTurn[]>([])
  const [currentIdx,  setCurrentIdx]  = useState(0)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [turnDuration,setTurnDuration]= useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Revoke blob URLs on unmount
  useEffect(() => () => { turns.forEach(t => URL.revokeObjectURL(t.url)) }, [turns])

  // ── Fetch all audio in one request ─────────────────────────────────────────

  const fetchPodcast = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/tts/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcast_script }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()

      const playable: PlayableTurn[] = (data.turns as { speaker: PodcastTurn['speaker']; audioBase64: string }[])
        .map((t, i) => {
          // base64 → Blob → object URL
          const bytes = Uint8Array.from(atob(t.audioBase64), c => c.charCodeAt(0))
          const blob  = new Blob([bytes], { type: 'audio/mpeg' })
          return {
            speaker: t.speaker,
            text:    podcast_script[i]?.text ?? '',
            url:     URL.createObjectURL(blob),
          }
        })
        .filter(t => t.url)   // skip empty turns

      setTurns(playable)
      setCurrentIdx(0)
      setStatus('ready')
      setIsPlaying(true)   // auto-play after loading
    } catch (err) {
      console.error('[PodcastPlayer] Failed:', err)
      setStatus('error')
    }
  }, [podcast_script])

  // ── Sequential playback effect ─────────────────────────────────────────────
  // Runs when isPlaying toggles or the turn index advances.
  // Cleanup pauses the audio so toggle-pause works mid-turn.

  useEffect(() => {
    if (!isPlaying || !turns[currentIdx]) return

    const audio = new Audio(turns[currentIdx].url)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setTurnDuration(audio.duration))
    audio.addEventListener('timeupdate',     () => setCurrentTime(audio.currentTime))

    const onEnded = () => {
      const next = currentIdx + 1
      if (next < turns.length) {
        setCurrentTime(0)
        setCurrentIdx(next)      // triggers re-run for next turn
      } else {
        setIsPlaying(false)
        setCurrentIdx(0)
        setCurrentTime(0)
      }
    }

    audio.addEventListener('ended', onEnded)
    audio.play().catch(console.error)

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audioRef.current = null
    }
  }, [currentIdx, isPlaying, turns])

  // ── Controls ────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    if (status === 'idle' || status === 'error') {
      fetchPodcast()
    } else if (status === 'ready') {
      setIsPlaying(p => !p)
    }
  }

  const restart = () => {
    setIsPlaying(false)
    setCurrentIdx(0)
    setCurrentTime(0)
    setTimeout(() => setIsPlaying(true), 80)
  }

  // Overall progress: which turn we're on + within-turn progress
  const overallProgress = turns.length > 0
    ? ((currentIdx + (turnDuration > 0 ? currentTime / turnDuration : 0)) / turns.length) * 100
    : 0

  const currentTurn = turns[currentIdx]
  const speakerConf = currentTurn ? SPEAKERS[currentTurn.speaker] : null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(219,39,119,0.05),rgba(99,102,241,0.05))',
        border: '1.5px solid rgba(99,102,241,0.18)',
        boxShadow: '0 4px 20px rgba(109,40,217,0.08)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2.5 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.10)', background: 'rgba(99,102,241,0.04)' }}
      >
        <Radio className="w-4 h-4 text-indigo-500" strokeWidth={2} />
        <span className="text-sm font-bold text-slate-800">Výukový podcast</span>

        {/* ON AIR badge — shows while playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
              <span className="text-xs font-bold tracking-widest" style={{ color: '#dc2626' }}>ON AIR</span>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-xs text-slate-400 ml-auto">
          {status === 'ready' ? `${podcast_script.length} replik` : '2 mluvčí · 3–5 min'}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* ── Speaker badges ── */}
        <div className="flex items-center gap-3">
          {(['teacher', 'student'] as const).map(s => {
            const conf    = SPEAKERS[s]
            const isActive = isPlaying && currentTurn?.speaker === s
            return (
              <motion.div
                key={s}
                animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background:  isActive ? conf.bg    : 'rgba(255,255,255,0.4)',
                  border:      `1.5px solid ${isActive ? conf.border : 'rgba(255,255,255,0.6)'}`,
                  color:       isActive ? conf.color  : '#94a3b8',
                  boxShadow:   isActive ? `0 4px 16px ${conf.border}` : 'none',
                }}
              >
                <span>{conf.emoji}</span>
                <span>{conf.label}</span>
                {isActive && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full ml-0.5"
                    style={{ background: conf.color }}
                  />
                )}
              </motion.div>
            )
          })}

          {/* Turn counter */}
          {status === 'ready' && (
            <span className="ml-auto text-xs font-mono text-slate-400">
              {currentIdx + 1} / {turns.length}
            </span>
          )}
        </div>

        {/* ── Main controls row ── */}
        <div className="flex items-center gap-4">

          {/* Play / Pause / Loading */}
          <button
            onClick={togglePlay}
            disabled={status === 'loading'}
            className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all disabled:opacity-60"
            style={{
              background: speakerConf
                ? `linear-gradient(135deg,${speakerConf.color},${speakerConf.color}bb)`
                : 'linear-gradient(135deg,#6366f1,#a855f7)',
              boxShadow: isPlaying
                ? `0 6px 20px ${speakerConf?.border ?? 'rgba(99,102,241,0.3)'}`
                : '0 4px 12px rgba(99,102,241,0.25)',
            }}
          >
            <AnimatePresence mode="wait">
              {status === 'loading' ? (
                <motion.div key="spin"
                  className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : isPlaying ? (
                <motion.div key="pause" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                  <Pause className="w-5 h-5 text-white" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                  <Play className="w-5 h-5 text-white" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Centre: waveform + text preview OR idle/loading message */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <AnimatePresence mode="wait">

              {status === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-bold text-slate-800">Poslechnout výukový podcast</p>
                  <p className="text-xs text-slate-500">Klikni — vygeneruje se rozhovor učitelky a studenta</p>
                </motion.div>
              )}

              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-bold text-slate-800">Generuji hlasy…</p>
                  <p className="text-xs text-slate-500">Nahrávám učitelku (nova) a studenta (onyx) — chvíli strpení</p>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-bold text-red-600">Nepodařilo se načíst podcast</p>
                  <button onClick={fetchPodcast} className="text-xs text-indigo-500 underline mt-0.5">
                    Zkusit znovu
                  </button>
                </motion.div>
              )}

              {status === 'ready' && currentTurn && speakerConf && (
                <motion.div key={`turn-${currentIdx}`}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-1.5"
                >
                  <Waveform isPlaying={isPlaying} speaker={currentTurn.speaker} />
                  <motion.p
                    key={`text-${currentIdx}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-xs leading-relaxed line-clamp-3 italic"
                    style={{ color: speakerConf.color }}
                  >
                    "{currentTurn.text.slice(0, 130)}{currentTurn.text.length > 130 ? '…' : ''}"
                  </motion.p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Restart — only when ready */}
          {status === 'ready' && (
            <button onClick={restart}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(99,102,241,0.08)' }}
              title="Přehrát od začátku"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          )}
        </div>

        {/* ── Overall progress bar ── */}
        {status === 'ready' && (
          <div className="space-y-1">
            <div
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(99,102,241,0.10)' }}
            >
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  background: speakerConf
                    ? `linear-gradient(90deg,${speakerConf.color},${speakerConf.color}88)`
                    : 'linear-gradient(90deg,#6366f1,#a855f7)',
                }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3, ease: 'linear' }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(turnDuration > 0 ? turnDuration : 0)}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
