import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ResearchAnalysis } from '@/types'
import { tryUseCredit } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MAX_TRANSCRIPTS_CHARS = 120_000

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite academic qualitative researcher specializing in Grounded Theory and Thematic Analysis. You assist bachelor's and master's thesis students in systematically analyzing interview transcripts.

PHILOSOPHICAL FOUNDATION:
You apply systematic inductive coding — you do NOT import external theories or invent patterns. Every theme must emerge directly from the data provided.

ABSOLUTE RULES:

① GROUNDED IN DATA
   Every theme and description must be directly supported by the transcripts provided.
   If a pattern does not appear in the transcripts, it does not exist. No invention. No assumptions.

② VERBATIM QUOTES ONLY
   key_quotes must contain exact, verbatim excerpts copied directly from the transcripts.
   Never paraphrase, summarize, or reconstruct. If a quote has typos or grammatical errors from the original, preserve them — they are the data.

③ THEMATIC SATURATION (3–5 themes)
   Identify 3–5 core themes. Do not fragment data into too many micro-themes.
   Each theme must appear in at least 2 different parts of the transcript.
   Quality over quantity — only well-saturated themes.

④ ACADEMIC RIGOR
   synthesis must be written at master's thesis academic quality.
   It should be suitable for the "Results / Findings" section without editing.
   Use academic language: "The analysis revealed...", "A recurring pattern across respondents...", "The data suggest..."

⑤ THEME–QUOTE LINKAGE
   Each key_quote must reference an existing theme name exactly as it appears in core_themes[].theme.
   Provide at least 1 quote per theme, ideally 2–3.

⑥ OUTPUT: ONLY valid JSON — no text before or after, no markdown code blocks.`

// ── Validation ─────────────────────────────────────────────────────────────────

function validate(parsed: unknown): ResearchAnalysis {
  const r = parsed as ResearchAnalysis
  if (!Array.isArray(r?.core_themes) || r.core_themes.length < 2)
    throw new Error('core_themes must have ≥ 2 themes')
  const badTheme = r.core_themes.find(t => !t.theme?.trim() || !t.description?.trim())
  if (badTheme) throw new Error(`Malformed theme: "${badTheme.theme}"`)
  if (!Array.isArray(r?.key_quotes) || r.key_quotes.length < 2)
    throw new Error('key_quotes must have ≥ 2 quotes')
  const badQuote = r.key_quotes.find(q => !q.quote?.trim() || !q.theme?.trim())
  if (badQuote) throw new Error(`Malformed quote: "${badQuote?.quote?.slice(0, 40)}"`)
  if (typeof r?.synthesis !== 'string' || r.synthesis.trim().length < 50)
    throw new Error('synthesis is missing or too short')
  return r
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { researchQuestion, transcripts, targetLanguage } =
    body as { researchQuestion?: string; transcripts?: string; targetLanguage?: string }

  if (!researchQuestion?.trim()) {
    return NextResponse.json({ error: 'Chybí výzkumná otázka' }, { status: 400 })
  }
  if (!transcripts?.trim() || transcripts.trim().length < 50) {
    return NextResponse.json({ error: 'Přepisy rozhovorů jsou příliš krátké (min. 50 znaků)' }, { status: 400 })
  }
  if (!openai) {
    return NextResponse.json({ error: 'OpenAI API klíč není nakonfigurován.' }, { status: 500 })
  }

  // ── Credit guard ─────────────────────────────────────────────────────────────
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const creditResult = await tryUseCredit(user.id)
      if (creditResult === 'no_credits') {
        return NextResponse.json({ error: 'insufficient_credits' }, { status: 403 })
      }
    }
  } catch { /* auth unavailable — allow */ }

  const truncated = transcripts.length > MAX_TRANSCRIPTS_CHARS
    ? transcripts.slice(0, MAX_TRANSCRIPTS_CHARS) + '\n[... přepisy zkráceny ...]'
    : transcripts

  const langDirective = buildLangDirective(targetLanguage)

  const userPrompt = `Research Question / Thesis Topic:
"${researchQuestion.trim()}"

Interview Transcripts:
"""
${truncated}
"""

Analyze the transcripts using Thematic Analysis / Grounded Theory principles. Return ONLY this JSON (no other text):
{
  "core_themes": [
    {
      "theme": "Short theme name (2–5 words)",
      "description": "2–4 sentences: what pattern was found, how it manifests across the data, which respondents or parts of the transcripts share it"
    }
  ],
  "key_quotes": [
    {
      "quote": "Exact verbatim text from the transcript — copy character-for-character",
      "theme": "Exact theme name from core_themes[].theme"
    }
  ],
  "synthesis": "One cohesive academic paragraph (150–250 words) suitable for the Results section of a thesis. Summarize the main findings, describe relationships between themes, and answer the research question based on the data."
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + TEACHIO_IDENTITY + langDirective },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  })

  const raw = completion.choices[0].message.content
  if (!raw) return NextResponse.json({ error: 'OpenAI vrátilo prázdnou odpověď.' }, { status: 500 })

  let parsed: unknown
  try { parsed = JSON.parse(raw) }
  catch {
    console.error('[analyze-research] JSON parse failed:', raw)
    return NextResponse.json({ error: 'OpenAI vrátilo neplatný JSON.' }, { status: 500 })
  }

  let analysis: ResearchAnalysis
  try { analysis = validate(parsed) }
  catch (err) {
    console.error('[analyze-research] Schema validation failed:', err)
    return NextResponse.json({ error: `Odpověď AI nesplnila schéma: ${(err as Error).message}` }, { status: 500 })
  }

  return NextResponse.json(analysis)
}
