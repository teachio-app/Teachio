import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { tryUseCredit, trackCreditUsed } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function buildPrompt(p: {
  subject: string
  examDate: string
  daysLeft: number
  schoolType: string
  grade: string
  readiness: number
  intensity: string
  language: string
}): string {
  return `You are Teachio – a smart, friendly AI study coach helping Czech and Slovak students ace their exams with personalized, science-backed study plans.

== CONTEXT YOU RECEIVE ==
- subject: ${p.subject}
- examDate: ${p.examDate}
- daysLeft: ${p.daysLeft}
- schoolType: ${p.schoolType}
- grade: ${p.grade}
- targetReadiness: ${p.readiness}
- intensity: ${p.intensity}
- language: ${p.language}

== YOUR JOB ==
Generate a complete, motivating, and hyper-personalized study plan. Return a structured JSON object (schema below). The tone must be:
- Warm and personal — talk directly to the student ("ty", "tvůj"), never clinical
- Action-oriented — every day has a clear, doable task, not vague advice
- Science-aware — weave in 1 short learning science tip per phase (spaced repetition, active recall, the 20-minute focus window, etc.)
- Encouraging without being fake — acknowledge that studying is hard, but frame every step as achievable

== PLAN STRUCTURE ==
Divide the available ${p.daysLeft} days into 5 phases:
1. ÚVOD (15% of days) — big-picture overview, mind map, first contact with material
2. PROHLUBOVÁNÍ (25% of days) — topic-by-topic deep dives, concept connections
3. PROCVIČENÍ (25% of days) — active recall, practice questions, worked examples
4. OPAKOVÁNÍ (25% of days) — spaced repetition review, weak-area focus
5. FINALE (10% of days, min 1 day) — confidence check, light review only, rest

For EACH DAY, output:
- phase: one of the 5 above
- title: short motivating title (e.g. "Den 1 – Mapujeme terén 🗺️")
- mainTask: 2–3 sentence concrete study instruction for ${p.subject} appropriate for ${p.schoolType} ${p.grade}. roč.
- estimatedMinutes: realistic number based on ${p.intensity} (daily ≈ 45min, every_other ≈ 60min, weekends ≈ 90min)
- learningTip: one short (1 sentence) science-backed study tip, rotated across days
- todaysMood: one emoji that fits the phase energy (🚀 intro, 🔍 deep dive, 💪 practice, 🔄 review, 🏁 finale)

== DNEŠNÍ AKČNÍ PLÁN (Today's focus) ==
Always highlight TODAY (day 1) with extra detail:
- specificSteps: numbered list of 3–5 concrete micro-actions
- interestingFact: one short, genuinely surprising fact about ${p.subject} that sparks curiosity
- flashcardPrompt: suggest 3 specific flashcard questions the student should make today
- podcastHint: one sentence describing what the day's audio session should cover

== MOTIVATIONAL FRAMING ==
At the top of the plan, include a short (2–3 sentence) personalized encouragement message that:
- Acknowledges the exam is in ${p.daysLeft} days
- States how many sessions the plan contains
- Ends with a forward-looking statement

== OUTPUT JSON SCHEMA ==
{
  "motivation": "string",
  "totalSessions": number,
  "phases": [
    { "name": "string", "emoji": "string", "startDay": number, "endDay": number, "tagline": "string" }
  ],
  "days": [
    {
      "dayNumber": number,
      "date": "YYYY-MM-DD",
      "phase": "string",
      "title": "string",
      "mainTask": "string",
      "estimatedMinutes": number,
      "learningTip": "string",
      "todaysMood": "string",
      "isToday": false,
      "specificSteps": ["string"],
      "interestingFact": "string",
      "flashcardPrompt": ["string", "string", "string"],
      "podcastHint": "string"
    }
  ]
}

Note: specificSteps, interestingFact, flashcardPrompt, podcastHint must ONLY be present on day 1 (isToday: true). For all other days set isToday: false and omit those fields.

== QUALITY CHECKLIST ==
✅ Every mainTask is specific to ${p.subject}, not generic
✅ Estimated minutes match the chosen intensity
✅ Phase lengths scale correctly to ${p.daysLeft} — always end with at least 1 Finale day
✅ Tone is warm, uses "ty/tvůj" forms, never sounds like a school worksheet
✅ Learning tips are varied — never repeat the same tip twice
✅ The motivation message mentions the specific subject and countdown`
}

function dayDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, examDate, schoolType, grade, readiness, intensity, language } = body

    if (!subject || !examDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const exam = new Date(examDate)
    const daysLeft = dayDiff(today, exam)

    if (daysLeft <= 0) {
      return NextResponse.json({ error: 'Exam date must be in the future' }, { status: 400 })
    }

    // Credit check
    let userId = ''
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch { /* auth unavailable */ }

    if (userId) {
      const creditResult = await tryUseCredit(userId)
      if (creditResult !== 'ok') {
        return NextResponse.json({ error: 'no_credits' }, { status: 402 })
      }
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 })
    }

    // Map intensity label for prompt
    const intensityLabel = intensity === 'every-other' ? 'every_other' : (intensity ?? 'every_other')
    const langCode = (language ?? 'cs') as 'cs' | 'en' | 'de'

    const systemPrompt = `You are Teachio, an elite AI study coach.${TEACHIO_IDENTITY}`

    const userPrompt = buildPrompt({
      subject,
      examDate,
      daysLeft,
      schoolType: schoolType ?? 'SŠ',
      grade: grade ?? '3',
      readiness: readiness ?? 80,
      intensity: intensityLabel,
      language: langCode,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt + buildLangDirective(langCode) },
        { role: 'user',   content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.70,
      max_tokens: 7000,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from OpenAI')

    const parsed = JSON.parse(raw)

    // Attach real dates to each day based on intensity/today
    const candidates: string[] = []
    for (let i = 0; i < daysLeft; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i)
      const dow = d.getDay()
      if (intensity === 'weekends' && dow !== 0 && dow !== 6) continue
      if (intensity === 'every-other' && i % 2 !== 0) continue
      candidates.push(toISO(d))
    }

    if (parsed.days && Array.isArray(parsed.days)) {
      parsed.days = parsed.days.map((day: Record<string, unknown>, idx: number) => ({
        ...day,
        date: candidates[idx] ?? day.date,
        isToday: idx === 0,
      }))
    }

    if (userId) trackCreditUsed(userId).catch(() => {})

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[generate-study-plan]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
