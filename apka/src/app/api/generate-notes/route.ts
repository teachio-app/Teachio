import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { SmartNotes, StudyModule, QuizQuestion, PodcastTurn, StudyLevel, ExamGoal } from '@/types'
import { tryUseCredit, trackCreditUsed } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Jsi elitní studijní coach, tutor a tvůrce interaktivních studijních modulů. Pomáháš studentům hluboce pochopit látku — ne jen memorovat — a testovat se formou kvízu.

ABSOLUTNÍ PRAVIDLA — PORUŠENÍ = ODMÍTNUTÍ VÝSTUPU:

① INTRODUCTION — Hák, který chytí pozornost
   2–3 věty. Překvapivý fakt, provokativní otázka nebo scénář z reálného světa.
   ✗ "Toto téma je důležité pro studenty."
   ✓ "Co mají společného mostní katastrofa v Tacoma Narrows a operní pěvec rozbíjející sklenku? Oba jsou důsledkem rezonance. Dnes se naučíš, proč vlny dokáží zničit most i zachránit život."

② TL;DR — Esence za 10 sekund
   Přesně 2 věty. Každá věta = konkrétní fakt, jméno nebo mechanismus. Žádná vata.

③ DEEP MODULES — 3 až 4 studijní moduly
   Každý modul má:
   — title: krátký, jasný název konceptu
   — explanation: 4–6 vět s konkrétními fakty (data, jména, vzorce, mechanismy)
   — analogy: jedna věta — reálná analogie, která udělá "klik" v hlavě
   ✗ explanation: "Tento koncept je složitý a má mnoho aspektů."
   ✓ analogy: "Je to jako Google Maps pro buňku — DNA je mapa, ribozom je navigace."

④ EXAM TRAPS — Chytáky ve 2. osobě, přísný formát
   Přesně 3 chytáky. Každý MUSÍ mít:
   "⚠️ [NÁZEV PASTI VELKÝMI]: Zkoušející tě nachytá na [X]. Většina odpoví '[Y]', ale chyba, protože [Z]. Správně: [formulace]."

⑤ MEMORY HACK — Povinná invence
   ZAKÁZÁNO: "Vytvoř myšlenkovou mapu", "Opakuj si pravidelně", obecné rady.
   POVINNÉ: konkrétní akronym NEBO absurdní příběh NEBO vizuální analogie specifická pro toto téma.

⑥ INTERACTIVE QUIZ — 5 multiple-choice otázek
   Každá otázka musí:
   — question: testovat porozumění, nikoli memorování
   — options: přesně 4 možnosti — jedna správná, tři přesvědčivě špatné (ne zjevné nesmysly)
   — correct_index: číslo 0–3 (index správné odpovědi)
   — explanation_why_correct: POVINNĚ použij PŘESNÝ TEXT z pole options.
     Formát: "Správně je '[přesný text správné možnosti]', protože [důvod].
     '[přesný text špatné možnosti 1]' je špatně, protože [důvod].
     '[přesný text špatné možnosti 2]' je špatně, protože [důvod]."
     NIKDY nepiš jiná slova než ta, která jsou v poli options.
   Otázky musí pokrývat různé úrovně: fakta, porozumění, aplikace, analýza.

⑦ ABSOLUTNÍ ZÁKAZ VATY
   Zakázané fráze: "Toto je komplexní téma", "Existuje mnoho přístupů", "Je důležité pochopit".
   Každá věta = minimálně 1 konkrétní informace.

⑧ PODCAST SKRIPT — VIRÁLNÍ RADIO SHOW (2 mluvčí, 8 replik)
   Skript je živý ROZHOVOR — ne monolog, ne přednáška.
   UČITELKA (speaker: "teacher"): charismatická expertka. Zahajuje překvapivým faktem, přerušuje sama sebe, reaguje emotivně.
   STUDENT (speaker: "student"): zvídavý, používá Feynmanovu techniku + emoce. Přerušuje, reaguje šokem, parafrázuje moderními analogiemi.

   POVINNÉ PRVKY V KAŽDÉ REPLICE:
   — Filler words: "Hmm —", "počkej —", "jo ale —", "hele —"
   — Přirozené přerušení myšlenky nebo partnera
   — Moderní analogie (TikTok, Netflix, gaming, AI)
   — Emoce: překvapení, šok, nadšení, ne robotické střídání

   PŘÍSNĚ ZAKÁZÁNO: "Vítejte v podcastu", robotické střídání bez emocí, akademický tón.

⑨ VÝSTUP: POUZE validní JSON, žádný text před/za ním.`

// ── Exam-goal directive ───────────────────────────────────────────────────────

function buildExamGoalDirective(examGoal: ExamGoal): string {
  switch (examGoal) {
    case 'bezna-pisemka': return ''

    case 'prijimaci-zkousky': return `
REŽIM: PŘIJÍMAČKY SŠ — Prioritizuj základy testované CERMATem. Jazyk: srozumitelný pro 14-15leté. Kvíz: typické formulace standardizovaných testů (záměna pojmů, "které NENÍ pravda"). Mnemotechnika: jednoduchá a vizuální.`

    case 'maturita': return `
REŽIM: MATURITA — Respektuj katalog požadavků. Kvíz: didaktické pasti (absolutní tvrzení "vždy/nikdy", záměna příčin a důsledků). Explanation v modulech musí obsahovat přesné definice pro didaktický test.`

    case 'statni-zaverecne': return `
REŽIM: STÁTNÍ ZKOUŠKY VŠ — Maximálně akademický tón. Deep modules musí obsahovat teoretické rámce, autory a paradigmata. Kvíz: otázky na úrovni zkušební komise (syntéza, kritické hodnocení, rozlišení podobných teorií). Analogy: sofistikované vědecké analogie.`
  }
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(topic: string, level: StudyLevel, examGoal: ExamGoal): string {
  const levelDirective: Record<StudyLevel, string> = {
    ZŠ: 'ÚROVEŇ ZŠ: Jednoduchý jazyk, konkrétní příklady z dětského světa. Kvíz: základní, max. 3 distraktory jsou zjevně špatně.',
    SŠ: 'ÚROVEŇ SŠ: Akademický jazyk, odborná terminologie. Kvíz: středně těžký, všechny 4 možnosti musí být věrohodné.',
    VŠ: 'ÚROVEŇ VŠ: Vědecký jazyk, teoretické rámce, autoři. Kvíz: obtížný — distraktory jsou velmi podobné správné odpovědi.',
  }
  const examDirective = buildExamGoalDirective(examGoal)

  return `Téma: "${topic}"
${levelDirective[level]}
${examDirective}

Vrať VÝHRADNĚ tento JSON (bez jakéhokoli dalšího textu):
{
  "introduction": "2–3 věty. Překvapivý fakt nebo otázka, která okamžitě upoutá pozornost k tématu '${topic}'.",
  "tl_dr": "Věta 1 — přesná definice nebo klíčový fakt o '${topic}'. Věta 2 — proč na tom záleží nebo jak se to používá.",
  "deep_modules": [
    {
      "title": "Název prvního klíčového konceptu k tématu '${topic}'",
      "explanation": "4–6 vět s konkrétními fakty, daty, jmény nebo mechanismy. Žádná vata.",
      "analogy": "Jedna věta — reálná analogie, která udělá klik v hlavě studenta."
    },
    {
      "title": "Název druhého konceptu",
      "explanation": "4–6 vět s fakty...",
      "analogy": "Jedna věta analogie..."
    },
    {
      "title": "Název třetího konceptu",
      "explanation": "4–6 vět s fakty...",
      "analogy": "Jedna věta analogie..."
    }
  ],
  "exam_traps": [
    "⚠️ [NÁZEV PASTI VELKÝMI]: Zkoušející tě nachytá na [X]. Většina odpoví '[Y]', ale chyba, protože [Z]. Správně: [formulace].",
    "⚠️ [NÁZEV DRUHÉ PASTI]: ...",
    "⚠️ [NÁZEV TŘETÍ PASTI]: ..."
  ],
  "memory_hack": "Konkrétní akronym NEBO absurdní příběh specifický pro '${topic}'. ZAKÁZÁNO: obecné rady.",
  "interactive_quiz": [
    {
      "question": "Otázka testující porozumění (ne memorování) tématu '${topic}'?",
      "options": ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
      "correct_index": 0,
      "explanation_why_correct": "Proč A je správně a proč B, C, D jsou špatně."
    },
    {
      "question": "Aplikační otázka?",
      "options": ["...", "...", "...", "..."],
      "correct_index": 1,
      "explanation_why_correct": "..."
    },
    {
      "question": "Analytická otázka?",
      "options": ["...", "...", "...", "..."],
      "correct_index": 2,
      "explanation_why_correct": "..."
    },
    {
      "question": "Otázka na záměnu pojmů (typická past)?",
      "options": ["...", "...", "...", "..."],
      "correct_index": 3,
      "explanation_why_correct": "..."
    },
    {
      "question": "Syntetická otázka propojující více konceptů?",
      "options": ["...", "...", "...", "..."],
      "correct_index": 0,
      "explanation_why_correct": "..."
    }
  ],
  "podcast_script": [
    { "speaker": "teacher", "text": "..." },
    { "speaker": "student", "text": "..." },
    { "speaker": "teacher", "text": "..." },
    { "speaker": "student", "text": "..." },
    { "speaker": "teacher", "text": "..." },
    { "speaker": "student", "text": "..." },
    { "speaker": "teacher", "text": "..." },
    { "speaker": "student", "text": "..." }
  ],
  "flashcards": [
    { "term": "Pojem 1 z tématu ${topic}", "definition": "Přesná definice pojmu 1" },
    { "term": "Pojem 2", "definition": "Přesná definice 2" },
    { "term": "Pojem 3", "definition": "Přesná definice 3" },
    { "term": "Pojem 4", "definition": "Přesná definice 4" },
    { "term": "Pojem 5", "definition": "Přesná definice 5" },
    { "term": "Pojem 6", "definition": "Přesná definice 6" },
    { "term": "Pojem 7", "definition": "Přesná definice 7" },
    { "term": "Pojem 8", "definition": "Přesná definice 8" },
    { "term": "Pojem 9", "definition": "Přesná definice 9" },
    { "term": "Pojem 10", "definition": "Přesná definice 10" }
  ],
  "mind_map_mermaid": "graph TD\\n  T[${topic}] --> C1[Klíčový pojem 1]\\n  T --> C2[Klíčový pojem 2]\\n  T --> C3[Klíčový pojem 3]\\n  C1 --> S1[Detail]\\n  C2 --> S2[Detail]",
  "interactive_game": ${level === 'ZŠ'
    ? `{
    "game_type": "sorting",
    "title": "Seřaď správně",
    "instructions": "Přetáhni do správného pořadí",
    "items": [
      {"id": 1, "text": "[První krok/koncept tématu ${topic}]"},
      {"id": 2, "text": "[Druhý krok/koncept]"},
      {"id": 3, "text": "[Třetí krok/koncept]"},
      {"id": 4, "text": "[Čtvrtý krok/koncept]"},
      {"id": 5, "text": "[Pátý krok/koncept]"}
    ]
  }`
    : `{
    "game_type": "matching",
    "title": "Spáruj pojmy",
    "instructions": "Vyber termín vlevo, pak správnou definici vpravo",
    "items": [
      {"left": "[Klíčový pojem 1 z ${topic}]", "right": "[Definice/popis 1]"},
      {"left": "[Klíčový pojem 2]", "right": "[Definice 2]"},
      {"left": "[Klíčový pojem 3]", "right": "[Definice 3]"},
      {"left": "[Klíčový pojem 4]", "right": "[Definice 4]"},
      {"left": "[Klíčový pojem 5]", "right": "[Definice 5]"},
      {"left": "[Klíčový pojem 6]", "right": "[Definice 6]"}
    ]
  }`}
}`
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(parsed: unknown): SmartNotes {
  const r = parsed as SmartNotes

  if (typeof r?.introduction !== 'string' || !r.introduction.trim())
    throw new Error('Missing introduction')
  if (typeof r?.tl_dr !== 'string' || !r.tl_dr.trim())
    throw new Error('Missing tl_dr')
  if (!Array.isArray(r?.deep_modules) || r.deep_modules.length < 2)
    throw new Error('Missing deep_modules (need ≥ 2)')
  const badModule = (r.deep_modules as StudyModule[]).find(
    m => !m.title?.trim() || !m.explanation?.trim() || !m.analogy?.trim()
  )
  if (badModule) throw new Error(`Malformed deep_module: "${badModule.title}"`)
  if (!Array.isArray(r?.exam_traps) || r.exam_traps.length < 2)
    throw new Error('Missing exam_traps')
  if (typeof r?.memory_hack !== 'string' || !r.memory_hack.trim())
    throw new Error('Missing memory_hack')
  if (!Array.isArray(r?.interactive_quiz) || r.interactive_quiz.length < 3)
    throw new Error('Missing interactive_quiz (need ≥ 3)')
  const badQ = (r.interactive_quiz as QuizQuestion[]).find(
    q => !q.question?.trim() ||
         !Array.isArray(q.options) || q.options.length !== 4 ||
         typeof q.correct_index !== 'number' ||
         q.correct_index < 0 || q.correct_index > 3 ||
         !q.explanation_why_correct?.trim()
  )
  if (badQ) throw new Error(`Malformed quiz question: "${badQ?.question?.slice(0, 40)}"`)

  if (r?.podcast_script !== undefined) {
    if (!Array.isArray(r.podcast_script) || r.podcast_script.length < 4)
      throw new Error('podcast_script present but has fewer than 4 turns')
    const badTurn = (r.podcast_script as PodcastTurn[]).find(
      t => !['teacher', 'student'].includes(t?.speaker) || !t?.text?.trim()
    )
    if (badTurn) throw new Error(`Malformed podcast_script turn (speaker: "${badTurn?.speaker}")`)
  }

  return r
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })

  const { topic, level, examGoal = 'bezna-pisemka', targetLanguage } =
    body as { topic?: string; level?: StudyLevel; examGoal?: ExamGoal; targetLanguage?: string }

  const VALID_LEVELS: StudyLevel[] = ['ZŠ', 'SŠ', 'VŠ']
  const VALID_GOALS: ExamGoal[] = ['bezna-pisemka', 'prijimaci-zkousky', 'maturita', 'statni-zaverecne']

  if (!topic?.trim() || !level || !VALID_LEVELS.includes(level)) {
    return NextResponse.json({ error: 'Chybí povinné parametry (topic, level)' }, { status: 400 })
  }
  const safeGoal: ExamGoal = VALID_GOALS.includes(examGoal) ? examGoal : 'bezna-pisemka'
  const isDeepMode = safeGoal === 'statni-zaverecne'

  // ── Credit guard ────────────────────────────────────────────────────────────
  let authedUserId: string | null = null
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      authedUserId = user.id
      const creditResult = await tryUseCredit(user.id)
      if (creditResult !== 'ok') {
        return NextResponse.json({ error: 'insufficient_credits' }, { status: 403 })
      }
    }
  } catch { /* auth unavailable — allow generation */ }

  if (!openai) {
    return NextResponse.json(
      { error: 'OpenAI API klíč není nakonfigurován. Nastavte OPENAI_API_KEY v .env.local.' },
      { status: 500 }
    )
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + TEACHIO_IDENTITY + buildLangDirective(targetLanguage) },
      { role: 'user',   content: buildUserPrompt(topic.trim(), level, safeGoal) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
    // Deep mode (VŠ state exams) needs more tokens for richer explanations
    max_tokens: isDeepMode ? 7200 : 6200, // flashcards + game + mind map
  })

  const raw = completion.choices[0].message.content
  if (!raw) {
    return NextResponse.json({ error: 'OpenAI vrátilo prázdnou odpověď.' }, { status: 500 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[generate-notes] JSON parse failed. Raw:\n', raw)
    return NextResponse.json({ error: 'OpenAI vrátilo neplatný JSON.' }, { status: 500 })
  }

  let notes: SmartNotes
  try {
    notes = validate(parsed)
  } catch (err) {
    console.error('[generate-notes] Schema validation failed:', err, '\nParsed:', JSON.stringify(parsed, null, 2))
    return NextResponse.json(
      { error: `Odpověď AI nesplnila schéma: ${(err as Error).message}` },
      { status: 500 }
    )
  }

  if (authedUserId) trackCreditUsed(authedUserId).catch(() => {})

  // Save to student_notes history (non-fatal if columns don't exist yet)
  if (authedUserId) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      const { data: saved } = await supabaseAdmin
        .from('student_notes')
        .insert({ user_id: authedUserId, topic: topic.trim(), level, notes_data: notes })
        .select('id')
        .single()
      if (saved?.id) return NextResponse.json({ ...notes, _note_id: saved.id })
    } catch { /* table columns not yet migrated — continue without saving */ }
  }

  return NextResponse.json(notes)
}
