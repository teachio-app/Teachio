'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface FloatingChatProps {
  /** Plain-text summary of the generated content. Pass null to hide the button. */
  documentContext: string | null
}

// ── Per-language strings ───────────────────────────────────────────────────────

const STRINGS: Record<string, {
  toggle: string; title: string; subtitle: string
  welcome: string; placeholder: string; send: string; thinking: string
}> = {
  cz: {
    toggle:      'Zeptej se Teachia',
    title:       'Teachio',
    subtitle:    'Zeptej se na cokoli z tohoto dokumentu',
    welcome:     'Ahoj! Jsem Teachio, tvůj studijní průvodce. Na co se chceš zeptat?',
    placeholder: 'Napiš svoji otázku…',
    send:        'Odeslat',
    thinking:    'Přemýšlím…',
  },
  en: {
    toggle:      'Ask Teachio',
    title:       'Teachio',
    subtitle:    'Ask anything about this document',
    welcome:     "Hi! I'm Teachio, your study guide. What would you like to know?",
    placeholder: 'Type your question…',
    send:        'Send',
    thinking:    'Thinking…',
  },
  de: {
    toggle:      'Teachio fragen',
    title:       'Teachio',
    subtitle:    'Frag mich zu diesem Dokument',
    welcome:     'Hallo! Ich bin Teachio, dein Lernassistent. Was möchtest du wissen?',
    placeholder: 'Schreib deine Frage…',
    send:        'Senden',
    thinking:    'Ich denke nach…',
  },
  fr: {
    toggle:      "Demander à l'IA",
    title:       'Tuteur IA',
    subtitle:    'Pose une question sur ce document',
    welcome:     "Bonjour ! Je suis Teachio, ton guide d'étude. Qu'est-ce que tu voudrais savoir ?",
    placeholder: 'Écris ta question…',
    send:        'Envoyer',
    thinking:    'Je réfléchis…',
  },
}

// ── Markdown-lite renderer (bold only) ────────────────────────────────────────

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ role, content, streaming }: { role: 'user' | 'assistant'; content: string; streaming?: boolean }) {
  const isUser = role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mr-2 mt-0.5"
          style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
          T
        </div>
      )}
      <div
        className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={isUser ? {
          background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
          color: '#fff',
          borderBottomRightRadius: 6,
        } : {
          background: 'rgba(255,255,255,0.85)',
          color: '#1e293b',
          border: '1px solid rgba(226,232,240,0.8)',
          borderBottomLeftRadius: 6,
        }}
      >
        {renderContent(content)}
        {streaming && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
            style={{ background: '#6366f1' }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FloatingChat({ documentContext }: FloatingChatProps) {
  const { lang } = useLanguage()
  const s = STRINGS[lang] ?? STRINGS.cz

  const [open,        setOpen]        = useState(false)
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [streaming,   setStreaming]   = useState(false)
  const [streamText,  setStreamText]  = useState('')
  const [initialized, setInitialized] = useState(false)

  const endRef    = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Cleanup on unmount
  useEffect(() => () => { abortRef.current?.abort() }, [])

  const handleOpen = useCallback(() => {
    if (!initialized) {
      setMessages([{ role: 'assistant', content: s.welcome }])
      setInitialized(true)
    }
    setOpen(true)
  }, [initialized, s.welcome])

  const handleClose = useCallback(() => {
    setOpen(false)
    abortRef.current?.abort()
    abortRef.current = null
    if (streaming) {
      setStreaming(false)
      // Persist whatever streamed so far
      if (streamText) {
        setMessages(prev => [...prev, { role: 'assistant', content: streamText }])
        setStreamText('')
      }
    }
  }, [streaming, streamText])

  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setStreaming(true)
    setStreamText('')

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body: JSON.stringify({
          messages:        history,
          documentContext: documentContext ?? '',
          targetLanguage:  lang,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamText(accumulated)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Nastala chyba. Zkuste to prosím znovu.' },
      ])
    } finally {
      setStreamText('')
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, streaming, messages, documentContext, lang])

  // Keyboard shortcut: Enter to send (Shift+Enter = newline not applicable since input is single-line)
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
  }

  // Don't render if no document to chat about
  if (!documentContext) return null

  return (
    <>
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col"
            style={{
              width:     'min(90vw, 380px)',
              height:    'min(70vh, 520px)',
              background:'rgba(248,250,252,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border:    '1.5px solid rgba(255,255,255,0.9)',
              borderRadius: 20,
              boxShadow: '0 24px 64px rgba(109,40,217,0.18),0 8px 24px rgba(0,0,0,0.10)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 shrink-0 rounded-t-[18px]"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm">T</div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">{s.title}</p>
                  <p className="text-xs text-white/70 mt-0.5 leading-none">{s.subtitle}</p>
                </div>
              </div>
              <button onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06z"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 scroll-smooth">
              {messages.map((msg, i) => (
                <Bubble key={i} role={msg.role} content={msg.content} />
              ))}
              {streaming && (
                <Bubble role="assistant" content={streamText || ' '} streaming />
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={submit}
              className="flex items-center gap-2 px-3 py-3 shrink-0 rounded-b-[18px]"
              style={{ borderTop: '1px solid rgba(226,232,240,0.7)', background: 'rgba(255,255,255,0.6)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={streaming ? s.thinking : s.placeholder}
                disabled={streaming}
                className="flex-1 text-sm bg-white rounded-xl px-3.5 py-2.5 border text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                style={{ border: '1.5px solid rgba(226,232,240,0.8)', fontSize: '13.5px' }}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
              >
                {streaming
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                  : <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                      <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.5a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.928.626l-1.333 3.305a.75.75 0 0 0 .812 1.021l10.5-4a.75.75 0 0 0 0-1.404l-10.5-4z"/>
                    </svg>
                }
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-toggle"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1,   y: 0 }}
            exit={{   opacity: 0, scale: 0.8,  y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={handleOpen}
            className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-2xl text-white font-semibold text-sm shadow-xl"
            style={{
              background:  'linear-gradient(135deg,#4f46e5,#7c3aed)',
              boxShadow:   '0 12px 32px rgba(99,102,241,0.40),0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-lg leading-none"
            >
              💬
            </motion.span>
            {s.toggle}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
