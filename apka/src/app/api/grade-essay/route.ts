import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { EssayGrade, GrammarIssue } from '@/types'
import { tryUseCredit } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MAX_ESSAY_CHARS = 15_000

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite academic writing coach and essay grader with 20 years of experience. You provide precise, constructive, encouraging feedback that genuinely helps students improve their writing.

ABSOLUTE RULES:

① GRADE — Use letter grades: A+, A, A-, B+, B, B-, C+, C, C-, D, F
   Also provide percentage (0–100). Be calibrated — not every essay is an A.
   Judge on: structure, argumentation, evidence, language, originality.

② FEEDBACK — 3–4 coherent paragraphs:
   — Paragraph 1: Overall impression and what the essay achieves
   — Paragraph 2: Strengths (specific, with examples from the text)
   — Paragraph 3: Weaknesses (specific, constructive, with examples)
   — Paragraph 4: The one most important thing to do to improve this specific essay

③ STRENGTHS — Exactly 2–3 items. Must cite specific parts of the essay.
   ✗ "Good structure" (too generic)
   ✓ "The opening paragraph effectively hooks the reader with the question '...' and immediately establishes the thesis."

④ IMPROVEMENTS — Exactly 2–3 items. Actionable and specific.
   ✗ "Write more clearly"
   ✓ "The third paragraph claims X but provides no evidence. Add a citation from a primary source or a concrete statistic."

⑤ GRAMMAR ISSUES — Find 3–6 real errors. For each:
   original: the EXACT phrase from the text with the error
   corrected: the corrected version
   explanation: WHY it is wrong (grammar rule, word choice, punctuation)
   If the essay has no grammatical errors, return an empty array.

⑥ IMPROVED_VERSION — A complete, professionally rewritten version of the essay.
   Preserve the student's core ideas and voice. Improve: clarity, flow, vocabulary, argument structure.
   Do NOT change the topic or introduce entirely new arguments.

⑦ OUTPUT: ONLY valid JSON. No text before or after.`

// ── Validation ────────────────────────────────────────────────────────────────

function validate(parsed: unknown): EssayGrade {
  const r = parsed as EssayGrade
  if (!r?.grade?.trim())                      throw new Error('Missing grade')
  if (typeof r?.percentage !== 'number' ||
      r.percentage < 0 || r.percentage > 100) throw new Error('Invalid percentage')
  if (!r?.feedback?.trim())                   throw new Error('Missing feedback')
  if (!Array.isArray(r?.strengths)    || r.strengths.length < 1)   throw new Error('Missing strengths')
  if (!Array.isArray(r?.improvements) || r.improvements.length < 1) throw new Error('Missing improvements')
  if (!Array.isArray(r?.grammar_issues))      throw new Error('Missing grammar_issues array')
  if (!r?.improved_version?.trim())           throw new Error('Missing improved_version')
  return r
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const { essay, topic, targetLanguage } =
    body as { essay?: string; topic?: string; targetLanguage?: string }

  if (!essay?.trim() || essay.trim().length < 50) {
    return NextResponse.json({ error: 'Essay is too short (min. 50 characters)' }, { status: 400 })
  }
  if (!openai) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  // ── Auth (non-fatal) ─────────────────────────────────────────────────────────
  let authedUserId: string | null = null
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) authedUserId = user.id
  } catch {}

  // ── Credit guard (fatal for auth'd users) ───────────────────────────────────
  if (authedUserId) {
    const creditResult = await tryUseCredit(authedUserId)
    if (creditResult === 'no_credits') {
      return NextResponse.json({ error: 'insufficient_credits' }, { status: 403 })
    }
    if (creditResult === 'error' || creditResult === 'no_profile') {
      return NextResponse.json({ error: 'Credit check failed' }, { status: 500 })
    }
  }

  const truncated = essay.trim().slice(0, MAX_ESSAY_CHARS)
  const topicLine = topic?.trim() ? `\nAssignment / Topic: "${topic.trim()}"` : ''

  const userPrompt = `${topicLine}

Essay to grade:
"""
${truncated}
"""

Return ONLY this JSON:
{
  "grade": "letter grade (A+, A, B+, B, C+, C, D, F)",
  "percentage": number 0-100,
  "feedback": "3–4 paragraphs of constructive narrative feedback",
  "strengths": ["Specific strength 1 with quote/example", "Specific strength 2"],
  "improvements": ["Specific actionable improvement 1", "Specific actionable improvement 2"],
  "grammar_issues": [
    { "original": "exact phrase from essay", "corrected": "fixed version", "explanation": "why it's wrong" }
  ],
  "improved_version": "Complete rewritten essay preserving the student's ideas and voice."
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + TEACHIO_IDENTITY + buildLangDirective(targetLanguage) },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  })

  const raw = completion.choices[0].message.content
  if (!raw) return NextResponse.json({ error: 'Empty OpenAI response' }, { status: 500 })

  let parsed: unknown
  try { parsed = JSON.parse(raw) }
  catch { return NextResponse.json({ error: 'Invalid JSON from OpenAI' }, { status: 500 }) }

  try {
    const result = validate(parsed)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[grade-essay] Validation failed:', err)
    return NextResponse.json({ error: `Schema error: ${(err as Error).message}` }, { status: 500 })
  }
}
