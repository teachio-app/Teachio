'use client'

import { useState } from 'react'
import { addTestCredits } from '@/lib/actions/credits'

export function DevCheatButton() {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const result = await addTestCredits()
      window.dispatchEvent(new CustomEvent('credits-updated'))
      // Brief visual feedback without blocking the UI
      console.info(`[DEV] Credits topped up to ${result.credits}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs font-mono text-slate-400 hover:text-indigo-400 px-2.5 py-1 rounded border border-slate-600/40 hover:border-indigo-400/40 transition-all disabled:opacity-50"
      title="Adds 50 credits — visible only in development mode"
    >
      {loading ? '⏳' : '🔧'} dev: +50 kreditů
    </button>
  )
}
