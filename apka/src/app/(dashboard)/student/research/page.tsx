'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, AlertTriangle, Quote, BookOpen, Copy, Check, Download, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { FloatingChat } from '@/components/ui/FloatingChat'
import type { ResearchAnalysis } from '@/types'

function buildResearchDocContext(result: ResearchAnalysis, question: string): string {
  const parts = [`RESEARCH QUESTION: ${question}`]
  if (result.core_themes?.length) {
    parts.push('\nCORE THEMES:\n' +
      result.core_themes.map((t, i) => `${i + 1}. ${t.theme}\n   ${t.description}`).join('\n\n'))
  }
  if (result.key_quotes?.length) {
    parts.push('\nKEY QUOTES:\n' +
      result.key_quotes.map(q => `"${q.quote}" → ${q.theme}`).join('\n\n'))
  }
  if (result.synthesis) parts.push('\nSYNTHESIS:\n' + result.synthesis)
  return parts.join('\n')
}

// ── PDF export ────────────────────────────────────────────────────────────────

function buildResearchPDFHTML(result: ResearchAnalysis, question: string): string {
  const themeGradients = ['#6366f1','#7c3aed','#0891b2','#059669','#d97706']
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"><title>Teachio Research – ${question.slice(0, 60)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:32px;color:#1e293b;line-height:1.7;font-size:14px}
  h1{font-size:22px;font-weight:800;margin:0 0 4px;color:#0891b2}
  .subtitle{color:#64748b;font-size:12px;margin-bottom:24px}
  .badge{display:inline-block;padding:2px 10px;background:#e0f2fe;color:#0e7490;border-radius:999px;font-size:11px;font-weight:700;margin-bottom:24px}
  h2{font-size:14px;font-weight:700;margin:24px 0 10px;padding-bottom:5px;border-bottom:2px solid #e2e8f0;color:#1e293b}
  .theme{display:flex;gap:12px;margin-bottom:12px;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;page-break-inside:avoid}
  .theme-num{width:26px;height:26px;border-radius:6px;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .theme-name{font-weight:700;font-size:13px;margin-bottom:3px}
  .theme-desc{font-size:13px;color:#475569}
  .quote-item{margin-bottom:10px;padding:10px 14px;background:#f0f9ff;border-radius:8px;border-left:3px solid #0891b2;page-break-inside:avoid}
  .quote-text{font-style:italic;color:#1e293b;margin-bottom:5px}
  .quote-theme{font-size:11px;font-weight:600;color:#0e7490;background:#e0f2fe;display:inline-block;padding:1px 8px;border-radius:999px}
  .synthesis{background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:16px 18px;font-size:13px;line-height:1.8;color:#1e293b}
  .footer{color:#94a3b8;font-size:10px;margin-top:28px;padding-top:10px;border-top:1px solid #e2e8f0}
</style></head><body>
<h1>🔬 Kvalitativní analýza dat</h1>
<div class="subtitle">Research Lab — Teachio</div>
<span class="badge">Výzkumná otázka: ${question}</span>
<h2>📊 Klíčová témata (${result.core_themes.length})</h2>
${result.core_themes.map((t, i) => `
<div class="theme">
  <div class="theme-num" style="background:${themeGradients[i % themeGradients.length]}">${i + 1}</div>
  <div><div class="theme-name">${t.theme}</div><div class="theme-desc">${t.description}</div></div>
</div>`).join('')}
<h2>💬 Klíčové citace (${result.key_quotes.length})</h2>
${result.key_quotes.map(q => `
<div class="quote-item">
  <div class="quote-text">&ldquo;${q.quote}&rdquo;</div>
  <span class="quote-theme">→ ${q.theme}</span>
</div>`).join('')}
<h2>📝 Akademická syntéza</h2>
<div class="synthesis">${result.synthesis}</div>
<p class="footer">Vygenerováno pomocí Teachio Research Lab • teachio.app</p>
</body></html>`
}

// ── Loading messages ───────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Čtu přepisy rozhovorů…',
  'Hledám opakující se vzorce…',
  'Kóduji tematické kategorie…',
  'Identifikuji klíčové citace…',
  'Píšu akademickou syntézu…',
]

const THEME_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#059669,#34d399)',
  'linear-gradient(135deg,#d97706,#fbbf24)',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <button onClick={handle}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        done
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-white/60 border-white/70 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/80'
      }`}>
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'Zkopírováno' : 'Kopírovat'}
    </button>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-10 text-center space-y-6"
        style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(109,40,217,0.09)' }}>
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)' }}
          >
            <FlaskConical className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
        </div>
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.p key={message}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
              className="text-slate-800 font-semibold text-lg">
              {message}
            </motion.p>
          </AnimatePresence>
          <p className="text-slate-400 text-sm">Obvykle 8–15 sekund</p>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(8,145,178,0.08)' }}>
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 rounded-full"
            style={{ background: 'linear-gradient(90deg,transparent,#0891b2,#6366f1,transparent)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const { lang, t }        = useLanguage()
  const [question, setQuestion] = useState('')
  const [transcripts, setTranscripts] = useState('')
  const [loading,        setLoading]        = useState(false)
  const [result,         setResult]         = useState<ResearchAnalysis | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const [uploadParsing,  setUploadParsing]  = useState(false)
  const [uploadError,    setUploadError]    = useState<string | null>(null)
  const [msgIdx,   setMsgIdx]   = useState(0)

  useEffect(() => {
    if (!loading) { setMsgIdx(0); return }
    const id = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2200)
    return () => clearInterval(id)
  }, [loading])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadError(null)
    setUploadParsing(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/parse-document', { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? t.common.uploadError)
      }
      const { text } = await res.json() as { text: string }
      setTranscripts(prev => prev ? prev + '\n\n' + text : text)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.common.uploadError)
    } finally {
      setUploadParsing(false)
    }
  }

  const handlePDF = async () => {
    if (!result) return
    const { downloadPdf } = await import('@/lib/downloadPdf')
    await downloadPdf(buildResearchPDFHTML(result, question), 'teachio-research-analysis.pdf')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || transcripts.trim().length < 50) return
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch('/api/analyze-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchQuestion: question,
          transcripts,
          targetLanguage: lang,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'insufficient_credits') {
          window.dispatchEvent(new CustomEvent('upgrade-modal-open'))
          return
        }
        throw new Error(d.error)
      }
      window.dispatchEvent(new CustomEvent('credits-updated'))
      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = question.trim().length > 0 && transcripts.trim().length >= 50

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="text-center space-y-6 pt-4 pb-2">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg,#0891b2 0%,#6366f1 50%,#7c3aed 100%)',
              boxShadow: '0 20px 60px rgba(8,145,178,0.35),0 4px 16px rgba(0,0,0,0.12)',
            }}>
            <FlaskConical className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.research.pageTitle}
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            {t.research.pageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: 'Tematická analýza',   sub: 'Grounded Theory přístup' },
            { label: 'Verbatim citace',      sub: 'přímé výňatky z dat' },
            { label: 'Akademická syntéza',   sub: 'výsledky pro diplomku' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 16px rgba(8,145,178,0.08)' }}>
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)' }} />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-none">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.82)',
            border: '1.5px solid rgba(255,255,255,0.92)',
            boxShadow: '0 20px 48px rgba(8,145,178,0.10),0 4px 12px rgba(99,102,241,0.07),inset 0 1px 0 rgba(255,255,255,0.95)',
          }}>
          <div className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg,#0891b2,#6366f1,#7c3aed,#6366f1,#0891b2)', backgroundSize: '200%' }} />

          <div className="p-8 sm:p-10">
            <form onSubmit={submit} className="space-y-6">

              {/* Research question */}
              <div className="space-y-2">
                <Label htmlFor="question" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Výzkumná otázka / Téma práce
                </Label>
                <Input
                  id="question"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Např. Jak studenti vnímají online výuku? / Jaké jsou motivační faktory u zaměstnanců?"
                  className="bg-white/70 border-white/60 focus:bg-white/90"
                  style={{ height: '52px', fontSize: '15px' }}
                />
              </div>

              {/* Transcripts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="transcripts" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Přepisy rozhovorů
                  </Label>
                  <span className="text-xs font-mono"
                    style={{ color: transcripts.length > 80000 ? '#d97706' : '#94a3b8' }}>
                    {transcripts.length.toLocaleString('cs')} znaků
                  </span>
                </div>
                <Textarea
                  id="transcripts"
                  value={transcripts}
                  onChange={e => setTranscripts(e.target.value)}
                  placeholder={`Vlož sem přepisy rozhovorů. Doporučený formát:\n\nRespondent 1:\n"Text odpovědi respondenta... může být velmi dlouhý a obsahovat celé odstavce."\n\nRespondent 2:\n"Další respondent říká..."\n\nAI analyzuje verbatim text — citace budou přesné výňatky.`}
                  className="bg-white/70 border-white/60 focus:bg-white/90 resize-none font-mono text-sm leading-relaxed"
                  style={{ minHeight: '280px', fontSize: '13px' }}
                />
                <p className="text-xs text-slate-400">
                  Min. 50 znaků. Optimální: 2 000–50 000 znaků (odpovídá 2–20 rozhovorům).
                </p>

                {/* File upload for transcript documents */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all group-hover:border-cyan-400 group-hover:text-cyan-700 group-hover:bg-cyan-50"
                    style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(226,232,240,0.8)', color: '#64748b' }}>
                    {uploadParsing
                      ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-cyan-300 border-t-cyan-600" />{t.common.uploadParsing}</>
                      : <><FileText className="w-3.5 h-3.5" />{t.common.uploadFile}</>
                    }
                  </div>
                  <span className="text-xs text-slate-400">{t.common.uploadHint}</span>
                  <input type="file" accept=".pdf,.docx,.doc,.txt,.md" className="sr-only" onChange={handleFileUpload} disabled={uploadParsing} />
                </label>
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 text-sm text-red-700 bg-red-50/90 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </motion.div>
              )}

              <button type="submit" disabled={loading || !canSubmit}
                className="w-full font-bold text-white rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: '56px', fontSize: '15px',
                  background: loading
                    ? 'linear-gradient(135deg,#0e7490,#4f46e5)'
                    : 'linear-gradient(135deg,#0891b2 0%,#6366f1 50%,#7c3aed 100%)',
                  boxShadow: (loading || !canSubmit) ? 'none' : '0 12px 40px rgba(8,145,178,0.30),0 4px 12px rgba(0,0,0,0.10)',
                }}>
                {loading ? '⏳ Analyzuji data…' : '🔬 Spustit analýzu'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingState message={LOADING_MESSAGES[msgIdx]} />}

      {/* ── Results ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto space-y-4">

            {/* ── Core Themes ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <FlaskConical className="w-4 h-4 text-cyan-600" strokeWidth={2} />
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">Klíčová témata</span>
                <span className="text-xs text-slate-400">({result.core_themes.length})</span>
              </div>

              {result.core_themes.map((theme, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.90)', boxShadow: '0 4px 20px rgba(8,145,178,0.07)' }}
                >
                  <div className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderBottom: '1px solid rgba(8,145,178,0.08)', background: 'rgba(8,145,178,0.04)' }}>
                    <span className="shrink-0 w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center"
                      style={{ background: THEME_GRADIENTS[i % THEME_GRADIENTS.length] }}>
                      {i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{theme.theme}</h4>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{theme.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Key Quotes ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(240,249,255,0.95)', border: '1.5px solid rgba(8,145,178,0.20)', boxShadow: '0 8px 28px rgba(8,145,178,0.10)' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(8,145,178,0.12)', background: 'rgba(8,145,178,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#0891b2,#6366f1)' }}>
                      <Quote className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-cyan-900">Klíčové citace</p>
                      <p className="text-xs text-cyan-700">Verbatim výňatky přímo z přepisů</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {result.key_quotes.map((q, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 + i * 0.05 }}
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(8,145,178,0.12)' }}>
                      <p className="text-sm text-slate-800 leading-relaxed italic mb-2.5">
                        &ldquo;{q.quote}&rdquo;
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(8,145,178,0.10)', color: '#0e7490' }}>
                        → {q.theme}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Synthesis ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <div style={{ padding: '2px', borderRadius: '18px', background: 'linear-gradient(135deg,#0891b2,#6366f1,#7c3aed)' }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(240,249,255,0.97)' }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(8,145,178,0.15)', background: 'rgba(8,145,178,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}>
                        <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-900">Akademická syntéza</p>
                        <p className="text-xs text-indigo-600">Připraveno pro sekci Výsledky diplomové práce</p>
                      </div>
                    </div>
                    <CopyBtn text={result.synthesis} />
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-slate-800 leading-relaxed">{result.synthesis}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom actions */}
            <div className="flex justify-center gap-3 pt-2 pb-4">
              <CopyBtn text={
                `VÝZKUMNÁ OTÁZKA: ${question}\n\n` +
                `KLÍČOVÁ TÉMATA:\n${result.core_themes.map((t, i) => `${i+1}. ${t.theme}\n${t.description}`).join('\n\n')}\n\n` +
                `KLÍČOVÉ CITACE:\n${result.key_quotes.map(q => `"${q.quote}" → ${q.theme}`).join('\n\n')}\n\n` +
                `AKADEMICKÁ SYNTÉZA:\n${result.synthesis}`
              } />
              <button onClick={handlePDF}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.85)', color: '#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(8,145,178,0.4)'; e.currentTarget.style.color = '#0e7490' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#64748b' }}>
                <Download className="w-4 h-4" />Stáhnout PDF
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Tutor chat ── */}
      <FloatingChat
        documentContext={result ? buildResearchDocContext(result, question) : null}
      />
    </div>
  )
}
