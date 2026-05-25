'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Radio } from 'lucide-react'
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
    color:  '#f472b6',
    bg:     'rgba(219,39,119,0.15)',
    border: 'rgba(219,39,119,0.40)',
    wave:   'linear-gradient(to top,#db2777,#f472b6)',
  },
  student: {
    emoji:  '👨‍🎓',
    label:  'Student',
    color:  '#818cf8',
    bg:     'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.40)',
    wave:   'linear-gradient(to top,#6366f1,#a78bfa)',
  },
} as const

// ── Animated waveform ──────────────────────────────────────────────────────────

const BAR_HEIGHTS = [6, 14, 9, 24, 11, 20, 7, 28, 13, 18, 22, 10, 26, 8, 19, 15, 25, 9, 21, 12, 17, 7, 23, 11]

function Waveform({ isPlaying, speaker }: { isPlaying: boolean; speaker: PodcastTurn['speaker'] }) {
  const conf = SPEAKERS[speaker]
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: '32px' }}>
      {BAR_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: conf.wave, transformOrigin: 'bottom', height: `${h}px` }}
          animate={{
            scaleY: isPlaying ? [0.2, 1, 0.35, 0.8, 0.15, 1, 0.5] : 0.12,
            opacity: isPlaying ? [0.7, 1, 0.8, 1, 0.6, 1, 0.9] : 0.35,
          }}
          initial={{ scaleY: 0.12, opacity: 0.35 }}
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
  if (isNaN(s) || !isFinite(s)) return '0:00'
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

  // Persistent audio element — created once, src is swapped per turn.
  // This is critical for iOS: we play() synchronously in the click handler
  // to unlock the element, then reuse it for async-loaded audio.
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrls = useRef<string[]>([])

  // Create the persistent audio element on mount
  useEffect(() => {
    const el = new Audio()
    audioRef.current = el

    el.addEventListener('loadedmetadata', () => setTurnDuration(el.duration))
    el.addEventListener('timeupdate',     () => setCurrentTime(el.currentTime))
    el.addEventListener('play',           () => setIsPlaying(true))
    el.addEventListener('pause',          () => setIsPlaying(false))
    el.addEventListener('ended', () => {
      setCurrentIdx(prev => {
        const next = prev + 1
        return next  // useEffect below advances playback
      })
    })

    return () => {
      el.pause()
      el.src = ''
      // Revoke all blob URLs
      blobUrls.current.forEach(u => URL.revokeObjectURL(u))
    }
  }, [])

  // Advance playback when currentIdx changes (after 'ended' event)
  useEffect(() => {
    const el = audioRef.current
    if (!el || !isPlaying) return
    if (currentIdx >= turns.length) {
      // All turns played
      setIsPlaying(false)
      setCurrentIdx(0)
      setCurrentTime(0)
      return
    }
    if (turns[currentIdx]) {
      setCurrentTime(0)
      el.src = turns[currentIdx].url
      el.load()
      el.play().catch(err => {
        console.error('[PodcastPlayer] play() failed on turn advance:', err)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

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

      // Revoke previous blob URLs
      blobUrls.current.forEach(u => URL.revokeObjectURL(u))
      blobUrls.current = []

      const playable: PlayableTurn[] = (data.turns as { speaker: PodcastTurn['speaker']; audioBase64: string }[])
        .filter(t => t.audioBase64)
        .map((t, i) => {
          const bytes = Uint8Array.from(atob(t.audioBase64), c => c.charCodeAt(0))
          const blob  = new Blob([bytes], { type: 'audio/mpeg' })
          const url   = URL.createObjectURL(blob)
          blobUrls.current.push(url)
          return {
            speaker: t.speaker,
            text:    podcast_script[i]?.text ?? '',
            url,
          }
        })

      if (playable.length === 0) throw new Error('No audio turns returned')

      setTurns(playable)
      setCurrentIdx(0)
      setStatus('ready')

      // Play first turn — audioRef was already unlocked synchronously in togglePlay
      const el = audioRef.current
      if (el) {
        setCurrentTime(0)
        el.src = playable[0].url
        el.load()
        el.play().catch(err => {
          console.error('[PodcastPlayer] auto-play after load failed:', err)
          // Not fatal — user can tap play again
        })
      }
    } catch (err) {
      console.error('[PodcastPlayer] Failed:', err)
      setStatus('error')
      setIsPlaying(false)
    }
  }, [podcast_script])

  // ── Controls ────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return

    if (status === 'idle' || status === 'error') {
      // iOS unlock: call play() synchronously within the user gesture.
      // We immediately pause — this just primes the audio element.
      el.play().then(() => el.pause()).catch(() => {})
      fetchPodcast()
    } else if (status === 'ready') {
      if (isPlaying) {
        el.pause()
      } else {
        if (el.src && el.src !== window.location.href) {
          el.play().catch(console.error)
        } else if (turns[currentIdx]) {
          el.src = turns[currentIdx].url
          el.load()
          el.play().catch(console.error)
        }
      }
    }
  }

  const restart = () => {
    const el = audioRef.current
    if (!el || turns.length === 0) return
    el.pause()
    setCurrentIdx(0)
    setCurrentTime(0)
    el.src = turns[0].url
    el.load()
    el.play().catch(console.error)
  }

  // Overall progress: which turn we're on + within-turn progress
  const overallProgress = turns.length > 0
    ? ((currentIdx + (turnDuration > 0 ? currentTime / turnDuration : 0)) / turns.length) * 100
    : 0

  const currentTurn = turns[currentIdx] ?? turns[0]
  const speakerConf = currentTurn ? SPEAKERS[currentTurn.speaker] : null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1.5px solid rgba(99,102,241,0.20)',
        boxShadow: '0 4px 24px rgba(99,102,241,0.12)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2.5 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', background: 'rgba(99,102,241,0.06)' }}
      >
        <Radio className="w-4 h-4" style={{ color: '#818cf8' }} strokeWidth={2} />
        <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Výukový podcast</span>

        {/* ON AIR badge */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}
            >
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
              <span className="text-xs font-bold tracking-widest" style={{ color: '#f87171' }}>ON AIR</span>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-xs ml-auto" style={{ color: '#475569' }}>
          {status === 'ready' ? `${turns.length} replik` : '2 mluvčí · 3–5 min'}
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
                  background:  isActive ? conf.bg    : 'rgba(255,255,255,0.05)',
                  border:      `1.5px solid ${isActive ? conf.border : 'rgba(255,255,255,0.10)'}`,
                  color:       isActive ? conf.color  : '#64748b',
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
            <span className="ml-auto text-xs font-mono" style={{ color: '#475569' }}>
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
                ? `linear-gradient(135deg,${speakerConf.color}99,${speakerConf.color})`
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
                  <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Poslechnout výukový podcast</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Klikni — vygeneruje se rozhovor učitelky a studenta</p>
                </motion.div>
              )}

              {status === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Generuji hlasy…</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>Nahrávám učitelku (nova) a studenta (onyx) — chvíli strpení</p>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm font-bold" style={{ color: '#f87171' }}>Nepodařilo se načíst podcast</p>
                  <button onClick={fetchPodcast} className="text-xs underline mt-0.5" style={{ color: '#818cf8' }}>
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
                    &ldquo;{currentTurn.text.slice(0, 130)}{currentTurn.text.length > 130 ? '…' : ''}&rdquo;
                  </motion.p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Restart — only when ready */}
          {status === 'ready' && (
            <button onClick={restart}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(99,102,241,0.10)' }}
              title="Přehrát od začátku"
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
            </button>
          )}
        </div>

        {/* ── Overall progress bar ── */}
        {status === 'ready' && (
          <div className="space-y-1">
            <div
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(99,102,241,0.12)' }}
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
            <div className="flex justify-between text-xs font-mono" style={{ color: '#475569' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(turnDuration > 0 ? turnDuration : 0)}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
