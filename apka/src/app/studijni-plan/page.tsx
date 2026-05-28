'use client'

import { useState, useEffect } from 'react'
import { PublicShell } from '@/components/ui/PublicShell'
import Link from 'next/link'

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const BG2 = 'rgba(255,255,255,0.03)'
const BD  = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'

interface SavedPlan {
  id: string
  subject: string
  examDate: string
  dailyMinutes: number
  createdAt: string
  totalSessions?: number
  completedSessions?: number
}

function daysLeft(examDate: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = Math.round((new Date(examDate).getTime() - today.getTime()) / 86400000)
  return Math.max(0, d)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return iso }
}

export default function StudijniPlanPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('teachio:plans:v1')
      if (raw) setPlans(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  const deletePlan = (id: string) => {
    const updated = plans.filter(p => p.id !== id)
    setPlans(updated)
    localStorage.setItem('teachio:plans:v1', JSON.stringify(updated))
  }

  const activePlans = plans.filter(p => daysLeft(p.examDate) > 0)
  const pastPlans   = plans.filter(p => daysLeft(p.examDate) <= 0)

  return (
    <PublicShell>
      {/* ── HERO ── */}
      <section style={{ padding: '96px 24px 60px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <div className="pub-au pub-au1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>📅 Studijní plány</span>
        </div>
        <h1 className="pub-au pub-au2" style={{ ...serif, fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16, color: TEXT }}>
          Tvoje zkouška.<br/>Tvůj plán.
        </h1>
        <p className="pub-au pub-au3" style={{ fontSize: 17, color: MUT, lineHeight: 1.68, marginBottom: 36 }}>
          Zadej předmět a termín — Teachio sestaví plán den po dni.
        </p>
        <Link href="/studijni-plan/novy" className="pub-au pub-au4 pub-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 32px rgba(124,58,237,0.45)' }}>
          ✨ Vytvořit první plán →
        </Link>
      </section>

      {/* ── PLANS ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 100px' }}>
        {!loaded ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUT }}>Načítám…</div>
        ) : plans.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '80px 24px', background: BG2, border: `1px solid ${BD}`, borderRadius: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📅</div>
            <h2 style={{ ...serif, fontSize: 26, fontWeight: 900, color: TEXT, marginBottom: 12 }}>Zatím žádný plán</h2>
            <p style={{ fontSize: 15, color: MUT, maxWidth: 400, margin: '0 auto 28px', lineHeight: 1.65 }}>
              Vytvoř svůj první studijní plán. Stačí zadat předmět a datum zkoušky.
            </p>
            <Link href="/studijni-plan/novy" className="pub-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(124,58,237,0.40)' }}>
              Vytvořit první plán →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Active plans */}
            {activePlans.length > 0 && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Aktivní plány</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {activePlans.map((plan, i) => {
                    const dl = daysLeft(plan.examDate)
                    const pct = plan.totalSessions ? Math.round(((plan.completedSessions ?? 0) / plan.totalSessions) * 100) : 0
                    return (
                      <div key={plan.id} className="pub-au pub-card-hover" style={{ animationDelay: `${0.06 * i}s`, background: BG2, border: `1px solid rgba(124,58,237,0.20)`, borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Hero row */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📚</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.subject}</div>
                            <div style={{ fontSize: 12, color: MUT }}>{formatDate(plan.examDate)}</div>
                          </div>
                        </div>
                        {/* Countdown */}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(124,58,237,0.10)', borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa' }}>{dl}</div>
                            <div style={{ fontSize: 11, color: MUT }}>dní zbývá</div>
                          </div>
                          {plan.totalSessions && (
                            <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(5,150,105,0.08)', borderRadius: 12, textAlign: 'center' }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: '#34d399' }}>{pct}%</div>
                              <div style={{ fontSize: 11, color: MUT }}>hotovo</div>
                            </div>
                          )}
                        </div>
                        {/* Progress bar */}
                        {plan.totalSessions && (
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                          </div>
                        )}
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/studijni-plan/${plan.id}`} style={{ flex: 1, textAlign: 'center', padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                            Otevřít plán
                          </Link>
                          <button onClick={() => deletePlan(plan.id)} style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
                            Smazat
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {/* New plan card */}
                  <Link href="/studijni-plan/novy" style={{ textDecoration: 'none' }}>
                    <div className="pub-card-hover" style={{ background: 'rgba(124,58,237,0.04)', border: '1px dashed rgba(124,58,237,0.25)', borderRadius: 20, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, cursor: 'pointer' }}>
                      <span style={{ fontSize: 28 }}>+</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>Nový plán</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Past plans */}
            {pastPlans.length > 0 && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Dokončené / prošlé</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pastPlans.map(plan => (
                    <div key={plan.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 18px', background: BG2, border: `1px solid ${BD}`, borderRadius: 12 }}>
                      <span style={{ fontSize: 18 }}>📚</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: MUT }}>{plan.subject}</span>
                        <span style={{ fontSize: 12, color: DIM, marginLeft: 8 }}>· {formatDate(plan.examDate)}</span>
                      </div>
                      <button onClick={() => deletePlan(plan.id)} style={{ padding: '4px 10px', borderRadius: 8, background: 'transparent', border: `1px solid ${BD}`, color: DIM, fontSize: 11, cursor: 'pointer' }}>Smazat</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </PublicShell>
  )
}
