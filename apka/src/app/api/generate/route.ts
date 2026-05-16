import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { generateMaterials, getGradeCategory } from '@/lib/templates/generator'
import { tryUseCredit } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'
import type {
  GenerationResult, QuizItem, SubjectArea,
  KlicovyPojem, EURFramework, WorksheetDraft, MatchingPair,
} from '@/types'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Jsi elitní Master Teacher s 25 lety zkušeností v moderní pedagogice. Navrhujete kompletní, poutavé výukové celky pomocí rámce E-U-R, které šetří učiteli 2 hodiny přípravy.

ABSOLUTNÍ PRAVIDLA:

① PEDAGOGICKÝ RÁMEC E-U-R (POVINNÝ)
   Každá fáze musí obsahovat konkrétní, pojmenovanou pedagogickou techniku (KWL, Think-Pair-Share, Exit ticket, Brainstorming atd.) s přesným průběhem. Žádné generické "učitel vysvětlí".

② PRACOVNÍ LIST — TEXTBOOKOVÁ KVALITA
   matching_exercise: přesně 7 párů termín ↔ definice/shoda relevantní pro téma.
   open_questions: přesně 3 hluboké, analytické otázky testující porozumění (ne memorování).
   creative_task: 1 syntetická nebo tvůrčí úloha propojující téma s reálným světem.

③ SVG ILUSTRACE — POVINNÁ SCHÉMA
   svg_illustration MUSÍ být validní SVG kód pro minimalistický černo-bílý diagram ve stylu učebnice.
   PŘESNÝ FORMÁT: <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
   Používej VÝHRADNĚ: <path>, <circle>, <rect>, <line>, <ellipse>, <polyline>, <polygon>, <g>, <defs>, <marker>
   Všechny elementy: stroke="black" fill="none" stroke-width="1.5"
   ZAKÁZÁNO: <text>, <script>, <style>, href, event handlery, fill s barvou (jen fill="none" nebo fill="black")
   Diagram musí vizuálně reprezentovat klíčový koncept tématu (buněčná membrána, geometrický tvar, časová osa, chemická vazba, fyzikální síly...).
   SVG musí být kompletní a korektně uzavřené.

④ SKUPINOVÁ AKTIVITA — KONKRÉTNÍ HRA
   Přesný název, počet žáků, materiály, 4 kroky průběhu, propojení s tématem.

⑤ SVP INKLUZE — SPECIFICKÁ PRO TOTO TÉMA
   ADHD, Dyslexie, Nadaný žák — vždy konkrétní strategie navázaná na toto konkrétní téma.

⑥ VÝSTUP: VÝHRADNĚ validní JSON, žádný text mimo JSON.`

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(topic: string, grade: string, duration: number): string {
  const cat = getGradeCategory(grade)
  const levelDir =
    cat === 'lower'  ? 'ÚROVEŇ 1.–3. tř: jednoduché, herní, příběhové. Matching: základní pojmy.' :
    cat === 'middle' ? 'ÚROVEŇ 4.–6. tř: přiměřeně odborné, skupinové. Matching: pojmy + definice.' :
                       'ÚROVEŇ 7.tř–SŠ: odborná terminologie, analytické otázky, primární prameny.'

  const timeE = Math.round(duration * 0.15)
  const timeU = Math.round(duration * 0.60)
  const timeR = duration - timeE - timeU

  return `Vytvoř Teacher Arsenal pro hodinu:
Téma: "${topic}" | Ročník: ${grade} | Délka: ${duration} min (E:${timeE}|U:${timeU}|R:${timeR})
${levelDir}

Vrať VÝHRADNĚ tento JSON:
{
  "subject": "history|math|physics|biology|chemistry|literature|geography|civics|general",
  "subjectLabel": "český název předmětu",
  "cigleHodiny": [
    "Žák [Bloomovo sloveso] [konkrétní výstup 1 z ${topic}]",
    "Žák [Bloomovo sloveso] [konkrétní výstup 2]",
    "Žák [Bloomovo sloveso] [konkrétní výstup 3]"
  ],
  "klicovePojmy": [
    { "term": "Pojem 1", "definition": "Přesná odborná definice." },
    { "term": "Pojem 2", "definition": "Přesná odborná definice." },
    { "term": "Pojem 3", "definition": "Přesná odborná definice." },
    { "term": "Pojem 4", "definition": "Přesná odborná definice." },
    { "term": "Pojem 5", "definition": "Přesná odborná definice." }
  ],
  "eur_framework": {
    "evocation": "EVOKACE (${timeE} min): [Název techniky + přesný průběh krok za krokem + co učitel píše/říká + jak žáci reagují. Min. 4 věty.]",
    "realization_of_meaning": "UVĚDOMĚNÍ (${timeU} min): [Interaktivní výuková metoda + průběh + min. 4 konkrétní fakta z ${topic} + mezipředmětové propojení. Min. 8 vět.]",
    "reflection": "REFLEXE (${timeR} min): [Název exit ticket techniky + přesné instrukce pro žáky + jak učitel s výsledky pracuje. Min. 3 věty.]"
  },
  "quiz": [
    { "question": "Faktická otázka z ${topic}?", "answer": "Přesná odpověď." },
    { "question": "Analytická otázka?", "answer": "Analytická odpověď." },
    { "question": "Aplikační otázka?", "answer": "Aplikační odpověď." },
    { "question": "Evaluační otázka?", "answer": "Hodnotící odpověď." },
    { "question": "Syntetická otázka?", "answer": "Syntetická odpověď." }
  ],
  "worksheet_draft": {
    "title": "Pracovní list: ${topic}",
    "matching_exercise": [
      { "term": "Termín 1", "match": "Správná definice/shoda 1" },
      { "term": "Termín 2", "match": "Správná definice/shoda 2" },
      { "term": "Termín 3", "match": "Správná definice/shoda 3" },
      { "term": "Termín 4", "match": "Správná definice/shoda 4" },
      { "term": "Termín 5", "match": "Správná definice/shoda 5" },
      { "term": "Termín 6", "match": "Správná definice/shoda 6" },
      { "term": "Termín 7", "match": "Správná definice/shoda 7" }
    ],
    "open_questions": [
      "Hluboká analytická otázka 1 k ${topic}?",
      "Hluboká analytická otázka 2?",
      "Hluboká syntetická otázka 3?"
    ],
    "creative_task": "Popis jedné tvůrčí nebo aplikační úlohy propojující ${topic} s reálným světem studenta.",
    "svg_illustration": "<svg viewBox=\\"0 0 400 300\\" xmlns=\\"http://www.w3.org/2000/svg\\" style=\\"width:100%;height:auto\\"><!-- Minimalistický učebnicový diagram pro ${topic}: použij path, circle, rect, line, polygon s stroke=\\"black\\" fill=\\"none\\" stroke-width=\\"1.5\\". Nakresli klíčový koncept tématu geometrickými tvary a šipkami. --></svg>"
  },
  "group_activity": "NÁZEV: [název]\\n\\nČas: 10 min | Skupiny: [počet] × [velikost]\\nMaterialy: [seznam]\\n\\nPRŮBĚH:\\n1. [Krok 1]\\n2. [Krok 2]\\n3. [Krok 3]\\n4. [Závěr/sdílení]\\n\\nPROPOJENÍ: [Propojení aktivity s tématem ${topic}]",
  "sen_inclusion": "🔵 ADHD — ${topic}: [Konkrétní technika pro udržení pozornosti]\\n\\n🟣 DYSLEXIE — ${topic}: [Konkrétní vizuální scaffolding]\\n\\n⭐ NADANÝ ŽÁK — ${topic}: [Konkrétní badatelský rozšiřující úkol]",
  "mind_map_mermaid": "graph TD\\n  T[${topic}] --> C1[Klíčový koncept 1]\\n  T --> C2[Klíčový koncept 2]\\n  T --> C3[Klíčový koncept 3]\\n  C1 --> S1[Detail 1]\\n  C2 --> S2[Detail 2]"
  "interactive_game": ${cat === 'lower'
    ? `{
    "game_type": "sorting",
    "title": "Seřaď správně",
    "instructions": "Přetáhni položky do správného pořadí",
    "items": [
      {"id": 1, "text": "[První krok/událost v tématu ${topic} — konkrétní]"},
      {"id": 2, "text": "[Druhý krok/událost]"},
      {"id": 3, "text": "[Třetí krok/událost]"},
      {"id": 4, "text": "[Čtvrtý krok/událost]"},
      {"id": 5, "text": "[Pátý krok/událost]"}
    ]
  }`
    : `{
    "game_type": "matching",
    "title": "Spáruj pojmy",
    "instructions": "Vyber termín vlevo, pak správnou definici vpravo",
    "items": [
      {"left": "[Klíčový pojem 1 z ${topic}]", "right": "[Přesná definice/vysvětlení 1]"},
      {"left": "[Klíčový pojem 2]", "right": "[Definice 2]"},
      {"left": "[Klíčový pojem 3]", "right": "[Definice 3]"},
      {"left": "[Klíčový pojem 4]", "right": "[Definice 4]"},
      {"left": "[Klíčový pojem 5]", "right": "[Definice 5]"},
      {"left": "[Klíčový pojem 6]", "right": "[Definice 6]"}
    ]
  }`}
}`
}

// ── Internal AI shape ─────────────────────────────────────────────────────────

interface AIArsenalResult {
  subject: SubjectArea
  subjectLabel: string
  cigleHodiny: string[]
  klicovePojmy: KlicovyPojem[]
  eur_framework: EURFramework
  quiz: QuizItem[]
  worksheet_draft: WorksheetDraft
  group_activity: string
  sen_inclusion: string
  interactive_game?: import('@/types').InteractiveGame
  mind_map_mermaid?: string
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateAIResult(parsed: unknown): AIArsenalResult {
  const r = parsed as AIArsenalResult
  const eur = r?.eur_framework
  const ws  = r?.worksheet_draft

  if (!r?.subject || !r?.subjectLabel)                                  throw new Error('Missing subject')
  if (!Array.isArray(r?.cigleHodiny)  || r.cigleHodiny.length < 3)    throw new Error('Missing cigleHodiny')
  if (!Array.isArray(r?.klicovePojmy) || r.klicovePojmy.length < 3)   throw new Error('Missing klicovePojmy')
  if (!eur?.evocation?.trim() || !eur?.realization_of_meaning?.trim() || !eur?.reflection?.trim())
    throw new Error('Incomplete eur_framework')
  if (!Array.isArray(r?.quiz) || r.quiz.length < 5)                    throw new Error('Missing quiz')

  // Worksheet validation
  if (!ws?.title?.trim())                                               throw new Error('Missing worksheet title')
  if (!Array.isArray(ws?.matching_exercise) || ws.matching_exercise.length < 4)
    throw new Error('matching_exercise needs ≥ 4 pairs')
  if (!Array.isArray(ws?.open_questions) || ws.open_questions.length < 2)
    throw new Error('open_questions needs ≥ 2 items')
  if (!ws?.creative_task?.trim())                                       throw new Error('Missing creative_task')
  if (!ws?.svg_illustration?.trim())                                    throw new Error('Missing svg_illustration')

  if (!r?.group_activity?.trim())   throw new Error('Missing group_activity')
  if (!r?.sen_inclusion?.trim())    throw new Error('Missing sen_inclusion')

  return r
}

// ── AI generation ─────────────────────────────────────────────────────────────

async function generateWithAI(
  topic: string, grade: string, duration: number, lang?: string
): Promise<AIArsenalResult> {
  const completion = await openai!.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + TEACHIO_IDENTITY + buildLangDirective(lang) },
      { role: 'user',   content: buildUserPrompt(topic, grade, duration) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
    max_tokens: 6800,  // SVG + worksheet + game + mind map
  })

  const raw = completion.choices[0].message.content
  if (!raw) throw new Error('Empty OpenAI response')

  let parsed: unknown
  try { parsed = JSON.parse(raw) }
  catch { throw new Error('OpenAI returned invalid JSON') }

  return validateAIResult(parsed)
}

// ── Supabase save (fire-and-forget) ──────────────────────────────────────────

async function saveLesson(
  userId: string, topic: string, grade: string, duration: number,
  result: GenerationResult
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('lessons').insert({
      user_id:       userId,
      topic, grade, duration,
      subject:       result.subject,
      subject_label: result.subjectLabel,
      lesson_plan:   result.eur_framework ?? result.lessonPlan ?? null,
      quiz:          result.quiz,
      image_url:     result.imageUrl ?? null,
    })
  } catch (err) {
    console.error('[Supabase] Save failed (non-fatal):', err)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Neplatné tělo požadavku' }, { status: 400 })

  const { topic, grade, duration, targetLanguage } =
    body as { topic?: string; grade?: string; duration?: string; targetLanguage?: string }

  if (!topic?.trim() || !grade || !duration) {
    return NextResponse.json({ error: 'Chybí povinné parametry' }, { status: 400 })
  }
  const durationNum = parseInt(duration)
  if (isNaN(durationNum) || durationNum < 10) {
    return NextResponse.json({ error: 'Neplatná délka hodiny' }, { status: 400 })
  }

  // ── Credit guard — identical pattern to the working student routes ──────────
  let authedUserId: string | null = null
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      authedUserId = user.id
      const creditResult = await tryUseCredit(user.id)
      if (creditResult === 'no_credits') {
        return NextResponse.json({ error: 'insufficient_credits' }, { status: 403 })
      }
    }
  } catch { /* auth unavailable — allow generation */ }

  const gradeCategory = getGradeCategory(grade)
  let result: GenerationResult

  if (openai) {
    let ai: AIArsenalResult
    try {
      ai = await generateWithAI(topic.trim(), grade, durationNum, targetLanguage)
    } catch (err) {
      console.error('[generate] AI generation failed:', err)
      return NextResponse.json(
        { error: `Generování selhalo: ${(err as Error).message}` },
        { status: 500 }
      )
    }
    result = {
      subject:          ai.subject,
      subjectLabel:     ai.subjectLabel,
      gradeCategory,
      cigleHodiny:      ai.cigleHodiny,
      klicovePojmy:     ai.klicovePojmy,
      eur_framework:    ai.eur_framework,
      worksheet_draft:  ai.worksheet_draft,
      group_activity:   ai.group_activity,
      sen_inclusion:    ai.sen_inclusion,
      interactive_game:  ai.interactive_game,
      mind_map_mermaid:  ai.mind_map_mermaid,
      quiz:              ai.quiz,
      imageUrl:         null,
      aiGenerated:      true,
    }
  } else {
    const t = generateMaterials(topic.trim(), grade, durationNum)
    result = { ...t, imageUrl: null, aiGenerated: false }
  }

  if (authedUserId) {
    saveLesson(authedUserId, topic.trim(), grade, durationNum, result).catch(() => {})
  }

  return NextResponse.json(result)
}
