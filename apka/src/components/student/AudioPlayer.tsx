'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Headphones, Volume2 } from 'lucide-react'

interface Props {
  script: string
}

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error'

// Asymmetric heights for an organic, non-mechanical look
const WAVEFORM = [8, 18, 11, 28, 9, 22, 15, 32, 10, 26, 18, 14, 30, 8, 20, 13, 27, 9, 23, 16, 29, 11, 19, 12]

function Waveform({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height: '32px' }}>
      {WAVEFORM.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: 'linear-gradient(to top,#6366f1,#a855f7)',
            height: `${h}px`,
            originY: 1,
          }}
          animate={isPlaying
            ? {
                scaleY: [0.18, 1, 0.3, 0.85, 0.12, 1, 0.45],
                opacity: [0.65, 1, 0.8, 1, 0.55, 1, 0.85],
              }
            : { scaleY: 0.12, opacity: 0.3 }
          }
          transition={{
            duration: 0.6 + (i % 5) * 0.1,
            repeat: isPlaying ? Infinity : 0,
            ease: 'easeInOut',
            delay: i * 0.03,
          }}
        />
      ))}
    </div>
  )
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function AudioPlayer({ script }: Props) {
  const [status,      setStatus]      = useState<PlayerStatus>('idle')
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [audioUrl,    setAudioUrl]    = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Revoke object URL on unmount
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  const fetchAndPlay = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })
      if (!res.ok) throw new Error(`TTS ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      setAudioUrl(url)
      setStatus('ready')
      // Auto-play after blob is ready
      setTimeout(() => audioRef.current?.play(), 80)
    } catch (err) {
      console.error('[AudioPlayer] TTS failed:', err)
      setStatus('error')
    }
  }, [script])

  const togglePlay = () => {
    if (status === 'idle') {
      fetchAndPlay()
    } else if (status === 'ready') {
      if (isPlaying) audioRef.current?.pause()
      else           audioRef.current?.play()
    }
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== 'ready' || !duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audioRef.current) audioRef.current.currentTime = ratio * duration
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.06))',
        border: '1.5px solid rgba(99,102,241,0.18)',
        boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
      }}
    >
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0) }}
        />
      )}

      <div className="flex items-center gap-4 px-5 py-4">

        {/* Play / Pause / Loading button */}
        <button
          onClick={togglePlay}
          disabled={status === 'loading' || status === 'error'}
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
          style={{
            background: status === 'idle'
              ? 'linear-gradient(135deg,#6366f1,#a855f7)'
              : isPlaying
                ? 'rgba(99,102,241,0.15)'
                : 'linear-gradient(135deg,#6366f1,#a855f7)',
            boxShadow: status === 'idle' || !isPlaying
              ? '0 4px 16px rgba(99,102,241,0.3)'
              : 'none',
          }}
          title={status === 'idle' ? 'Spustit výklad' : isPlaying ? 'Pozastavit' : 'Pokračovat'}
        >
          <AnimatePresence mode="wait">
            {status === 'loading' ? (
              <motion.div key="spin"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                style={{ animation: 'spin 1s linear infinite' }}
              />
            ) : isPlaying ? (
              <motion.div key="pause" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                <Pause className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div key="play" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                <Play className="w-5 h-5 text-white" strokeWidth={2.5}
                  style={{ marginLeft: '2px' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Centre: waveform + label OR progress */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-bold text-indigo-700">Poslechnout výpisky jako podcast</p>
                <p className="text-xs text-slate-500 mt-0.5">Klikni — virální výklad, cca 1 minuta poslechu</p>
              </motion.div>
            )}

            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-bold text-slate-700">Generuji zvukový výklad…</p>
                <p className="text-xs text-slate-400 mt-0.5">Teachio generuje zvukový výklad…</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-bold text-red-600">Nepodařilo se načíst zvuk</p>
                <button onClick={() => { setStatus('idle'); setAudioUrl(null) }}
                  className="text-xs text-indigo-500 underline mt-0.5">
                  Zkusit znovu
                </button>
              </motion.div>
            )}

            {status === 'ready' && (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-1.5">
                {/* Waveform + time */}
                <div className="flex items-center gap-3">
                  <Waveform isPlaying={isPlaying} />
                  <span className="text-xs font-mono text-slate-500 shrink-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                {/* Seek bar */}
                <div
                  className="relative h-1.5 rounded-full cursor-pointer"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                  onClick={seekTo}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg,#6366f1,#a855f7)',
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: icon badge */}
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.10)' }}
        >
          {status === 'ready'
            ? <Volume2 className="w-4 h-4 text-indigo-500" strokeWidth={2} />
            : <Headphones className="w-4 h-4 text-indigo-400" strokeWidth={2} />
          }
        </div>
      </div>

      {/* CSS spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
