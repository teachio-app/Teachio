'use client'

import { useState } from 'react'
import { setUserCredits, addUserCredits } from '@/lib/actions/admin'

// Cost model: gpt-4o-mini text + occasional TTS ≈ $0.018 per credit
const COST_PER_CREDIT = 0.018

export interface AdminRow {
  id: string
  email: string
  role: 'teacher' | 'student' | null
  credits: number
  creditsUsed: number
  streak: number
  lastActive: string | null
  joined: string
}

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff === 0) return 'dnes'
  if (diff === 1) return 'včera'
  return `před ${diff} dny`
}

function fmt(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

function CreditEditor({ row }: { row: AdminRow }) {
  const [credits,  setCredits]  = useState(row.credits)
  const [input,    setInput]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [flash,    setFlash]    = useState<'ok' | 'err' | null>(null)

  async function apply(newVal: number) {
    setSaving(true)
    const { ok } = await setUserCredits(row.id, newVal)
    if (ok) { setCredits(newVal); setFlash('ok') }
    else setFlash('err')
    setSaving(false)
    setTimeout(() => setFlash(null), 1800)
  }

  async function applyDelta(delta: number) {
    setSaving(true)
    const { ok, newCredits } = await addUserCredits(row.id, delta)
    if (ok && newCredits !== undefined) { setCredits(newCredits); setFlash('ok') }
    else setFlash('err')
    setSaving(false)
    setTimeout(() => setFlash(null), 1800)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Current credits */}
      <span
        className="text-sm font-bold tabular-nums min-w-[40px]"
        style={{
          color: flash === 'ok' ? '#4ade80' : flash === 'err' ? '#f87171' : credits > 0 ? '#7dd3fc' : '#475569',
          transition: 'color 0.3s',
        }}
      >
        💎 {credits}
      </span>

      {/* Quick +/- buttons */}
      <button
        onClick={() => applyDelta(-10)}
        disabled={saving}
        title="−10 kreditů"
        className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-colors disabled:opacity-40"
        style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171' }}
      >−</button>

      {/* Manual input */}
      <input
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="set"
        className="w-14 h-6 rounded-lg text-xs text-center font-bold bg-white/10 border border-white/15 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-400"
        onKeyDown={e => {
          if (e.key === 'Enter' && input !== '') {
            apply(parseInt(input, 10) || 0)
            setInput('')
          }
        }}
      />

      <button
        onClick={() => applyDelta(+10)}
        disabled={saving}
        title="+10 kreditů"
        className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-colors disabled:opacity-40"
        style={{ background: 'rgba(74,222,128,0.18)', color: '#4ade80' }}
      >+</button>

      {/* Set button (only shown when input has value) */}
      {input !== '' && (
        <button
          onClick={() => { apply(parseInt(input, 10) || 0); setInput('') }}
          disabled={saving}
          className="px-2 h-6 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)' }}
        >
          {saving ? '…' : 'SET'}
        </button>
      )}
    </div>
  )
}

export function AdminClient({ rows, stats }: {
  rows: AdminRow[]
  stats: { label: string; value: number | string; icon: string }[]
}) {
  const [search, setSearch] = useState('')

  const totalCost = rows.reduce((sum, r) => sum + r.creditsUsed * COST_PER_CREDIT, 0)
  const filtered  = rows.filter(r => r.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10"
      style={{ background: 'linear-gradient(145deg,#0f0f1a 0%,#1a1025 50%,#0f1a1a 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Teachio Admin</h1>
            <p className="text-xs text-slate-400">
              Celkové odhadované náklady na AI: <span className="text-emerald-400 font-bold">${totalCost.toFixed(2)}</span>
              <span className="text-slate-600 ml-1">(~${COST_PER_CREDIT}/generace)</span>
            </p>
          </div>
          <span className="ml-auto text-xs text-slate-500 hidden sm:block">
            {new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} · obnoviž pro aktuální data
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hledat podle e-mailu…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />

        {/* Table */}
        <div className="rounded-2xl overflow-x-auto"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>

          {/* Header */}
          <div className="grid gap-3 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 min-w-[900px]"
            style={{
              gridTemplateColumns: '2fr 1fr 1.8fr 1fr 1fr 1fr 1fr',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.03)',
            }}>
            <span>Email</span>
            <span>Role</span>
            <span>Kredity · upravit</span>
            <span>AI náklady</span>
            <span>Streak</span>
            <span>Aktivní</span>
            <span>Registrace</span>
          </div>

          {/* Rows */}
          <div className="divide-y min-w-[900px]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {filtered.map(r => {
              const cost = r.creditsUsed * COST_PER_CREDIT
              return (
                <div
                  key={r.id}
                  className="grid gap-3 px-5 py-3.5 items-center hover:bg-white/5 transition-colors"
                  style={{ gridTemplateColumns: '2fr 1fr 1.8fr 1fr 1fr 1fr 1fr' }}
                >
                  <span className="text-sm text-slate-200 font-medium truncate">{r.email}</span>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full w-fit"
                    style={r.role === 'teacher'
                      ? { background: 'rgba(99,102,241,0.20)', color: '#a5b4fc' }
                      : r.role === 'student'
                      ? { background: 'rgba(168,85,247,0.20)', color: '#d8b4fe' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                    {r.role === 'teacher' ? '👨‍🏫 Učitel' : r.role === 'student' ? '🎓 Student' : '—'}
                  </span>

                  <CreditEditor row={r} />

                  <div>
                    <span className="text-sm font-bold"
                      style={{ color: cost > 0 ? '#4ade80' : '#475569' }}>
                      {cost > 0 ? `$${cost.toFixed(3)}` : '—'}
                    </span>
                    {r.creditsUsed > 0 && (
                      <p className="text-xs text-slate-600 mt-0.5">{r.creditsUsed} gen.</p>
                    )}
                  </div>

                  <span className="text-sm font-bold" style={{ color: r.streak > 0 ? '#fca5a5' : '#475569' }}>
                    {r.streak > 0 ? `🔥 ${r.streak}` : '—'}
                  </span>

                  <span className="text-xs text-slate-400">{daysSince(r.lastActive)}</span>
                  <span className="text-xs text-slate-500">{fmt(r.joined)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          {rows.length} uživatelů · náklady jsou odhad ~${COST_PER_CREDIT}/generace (gpt-4o-mini + TTS)
        </p>
      </div>
    </div>
  )
}
