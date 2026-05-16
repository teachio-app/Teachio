'use client'

/**
 * Safely renders a Mermaid.js diagram string.
 * - Dynamically imports mermaid (client-only, never runs on server)
 * - Wraps render() in try/catch — bad syntax from AI never crashes the app
 * - Shows a localised fallback message on error
 */

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Props {
  chart: string
}

export function MermaidDiagram({ chart }: Props) {
  const { lang } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  // Localised fallback messages — avoids adding another translations key
  const fallback: Record<string, string> = {
    cz: '🗺️ Mapu se nepodařilo vykreslit.',
    en: '🗺️ Could not render the mind map.',
    de: '🗺️ Die Mindmap konnte nicht gerendert werden.',
    fr: '🗺️ Impossible d\'afficher la carte mentale.',
  }

  useEffect(() => {
    if (!chart?.trim() || !ref.current) return

    let cancelled = false

    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          flowchart: { htmlLabels: false, curve: 'basis' },
          themeVariables: {
            primaryColor:       '#ede9fe',
            primaryTextColor:   '#1e1b4b',
            primaryBorderColor: '#7c3aed',
            lineColor:          '#7c3aed',
            secondaryColor:     '#f5f3ff',
            background:         'transparent',
            fontSize:           '14px',
          },
        })

        // Unique ID per invocation — mermaid appends a temporary element by this id
        const uid = `mm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const { svg } = await mermaid.render(uid, chart.trim())

        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg
        setStatus('ok')
      } catch (err) {
        if (!cancelled) {
          console.warn('[MermaidDiagram] render failed:', (err as Error).message)
          setStatus('error')
        }
      }
    })()

    return () => { cancelled = true }
  }, [chart])

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center py-6 rounded-xl"
        style={{ background: 'rgba(248,250,252,0.8)', border: '1px dashed rgba(226,232,240,0.8)' }}>
        <p className="text-sm text-slate-400">{fallback[lang] ?? fallback.cz}</p>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      // Horizontally scroll wide diagrams; centre the SVG; constrain max width
      className="w-full overflow-x-auto rounded-xl [&>svg]:mx-auto [&>svg]:max-w-full"
      style={{ minHeight: status === 'idle' ? 80 : undefined }}
    />
  )
}
