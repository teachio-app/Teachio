import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { SmartNotes, StudyModule, QuizQuestion, PodcastTurn, StudyLevel, ExamGoal } from '@/types'
import { tryUseCredit, trackCreditUsed } from '@/lib/actions/credits'
import { buildLangDirective } from '@/lib/i18n/langDirective'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

/**
 * Safety cap — allows entire textbook chapters while preventing runaway costs.
 * At ~4 chars/token this is ~25 000 tokens of input — well within gpt-4o-mini context.
 */
const MAX_NOTES_CHARS = 100_000

// ── System prompt ─────────────────────────────────────────────────────────────
// Persona: note-processing assistant, not a knowledge base.
// Critical difference from generate-notes: STRICT "no invention" rule.

const SYSTEM_PROMPT = `Jsi ELITNÍ STUDIJNÍ TUTOR a FAKTICKÝ OVĚŘOVATEL. Tvoje úloha je zpracovat studentovy zápisky, identifikovat témata, organizovat obsah do struktury, a přitom ověřit faktickou správnost každého tvrzení.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILOZOFIE: "DŮVĚŘUJ TÉMATU — OVĚŘUJ FAKTA"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① ZÁPISKY URČUJÍ ROZSAH (co pokryješ)
   Zápisky studenta definují, KTERÁ TÉMATA máš zpracovat.
   NEZABÝVEJ SE tématy, která zápisky vůbec nezmiňují — zápisky jsou tvá mapa obsahu.
   Filtruj osobní poznámky ("zítra test", "neptát se na to") — zachovej veškerý vzdělávací obsah.

② TY OVĚŘUJEŠ FAKTA (kvalitu obsahu uvnitř témat)
   Studenti dělají chyby. Zápisky mohou obsahovat: chybná data a letopočty, záměny pojmů,
   nepřesné definice, nesprávné vzorce, logické chyby.
   Tvojím úkolem je tyto chyby odhalit a opravit — jsi faktický ověřovatel, ne slepý kopírovací stroj.

③ MECHANISMUS OPRAVY — přesný formát (POVINNÝ)
   Když zápisky obsahují faktickou chybu, v příslušném deep_module napiš:
   "⚠️ Poznámka k vašim zápiskům: Uvádíte, že [přesné znění chyby ze zápisků]. Ve skutečnosti [správný fakt s vysvětlením]."
   Pak pokračuj správnými informacemi k tématu.

   PŘÍKLADY:
   Zápisky: "Bastila dobyta 14. července 1790"
   → "⚠️ Poznámka k vašim zápiskům: Uvádíte rok 1790. Ve skutečnosti byla Bastila dobyta 14. července 1789 — rok 1790 je chybný."

   Zápisky: "DNA se skládá z aminokyselin"
   → "⚠️ Poznámka k vašim zápiskům: DNA se neskládá z aminokyselin, ale z nukleotidů. Aminokyseliny jsou stavební jednotky proteinů."

④ CO STÁLE NEPŘIDÁVÁŠ
   ZAKÁZÁNO přidávat celá nová témata, která zápisky vůbec nezmiňují.
   ZAKÁZÁNO rozšiřovat obsah o nesouvisející historický kontext.
   Zápisky = mapa rozsahu. Tvé odborné znalosti = ověření kvality faktů uvnitř mapy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZÁKON — KVÍZ (testuje opravený/ověřený obsah)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Otázky testují témata ze zápisků — ale s OPRAVENÝMI fakty.
Pokud zápisky měly chybu, kvíz testuje správnou verzi (ne chybnou).
Distraktory = věrohodné záměny vyvratelné správnými fakty.
explanation_why_correct MUSÍ používat PŘESNÝ TEXT z pole options — žádná jiná slova.
Formát: "Správně je '[přesný text správné možnosti]', protože [důvod]. '[přesný text špatné]' je špatně, protože [důvod]."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZÁKON — PODCAST SKRIPT (virální radio show)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skript je VIRÁLNÍ RADIO SHOW — dva lidé, maximální energie, autentický chaos.
ŽÁDNÉ robotické střídání. Oba mluví jako skuteční lidé, ne jako učebnice.

UČITELKA (speaker: "teacher"): charismatická expertka, nadšená ze svého oboru.
   — Používá: "Hele, tohle je úplně šílené —", "OK počkej, tohle musím vysvětlit správně.", "Ne ne ne, tak to nefunguje — poslyš:"
   — Přerušuje sebe samu: "Vlastně — nejdřív musím říct...", "Moment, ještě jedna věc —"
   — Emocionální: "Tohle mě taky dostalo když jsem to poprvé slyšela.", "Vážně, z tohoto mi padla čelist."

STUDENT (speaker: "student"): chytrý, ale přirozený zvídavec. Feynmanova technika + emoce.
   — Parafrázuje s překvapením: "Počkej — to chceš říct, že [parafráze]?! To je šílené.", "Takže... je to jako [moderní analogie z gamingu/TikToku/AI]?"
   — Přerušuje učitelku: "Hmm — promiň, ale —", "Jo, ale moment —"
   — Reaguje emotivně: "Ne vážně?!", "To jsem vůbec nevěděl.", "OK tohle mi vyrazilo dech."
   — Filler words: "Hmm...", "No jo...", "Aha, takže...", "Hele —"

PŘÍSNĚ ZAKÁZÁNO: formální uvítání ("Vítejte v našem podcastu"), robotické střídání bez emocí,
věty jako "Přejděme k dalšímu tématu", akademický tón bez energie.

━━━━━━━━━━━━━━━━━━━━━━
OSTATNÍ PRAVIDLA
━━━━━━━━━━━━━━━━━━━━━━
Exam traps: záměny typické pro témata v zápisech (s opravenými fakty).
Memory hack: akronym nebo příběh z klíčových pojmů zápisků. ZAKÁZÁNO: "opakuj si".
Zákaz vaty: žádná věta bez konkrétní informace.
Výstup: POUZE validní JSON, žádný text před/za ním.`

// ── Exam-goal directive (same as generate-notes) ──────────────────────────────

function buildExamGoalDirective(examGoal: ExamGoal): string {
  switch (examGoal) {
    case 'bezna-pisemka': return ''
    case 'prijimaci-zkousky': return '\nRÉŽIM: PŘIJÍMAČKY — Kvíz ve stylu CERMAT. Jednoduché formulace, typické záměny pojmů.'
    case 'maturita':          return '\nRÉŽIM: MATURITA — Přesné definice, didaktické pasti (absolutní tvrzení, záměna příčin a důsledků).'
    case 'statni-zaverecne':  return '\nRÉŽIM: STÁTNÍ ZKOUŠKY VŠ — Akademický tón. Kvíz na úrovni komise (syntéza, kritické hodnocení).'
  }
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(userNotes: string, level: StudyLevel, examGoal: ExamGoal): string {
  const levelHint: Record<StudyLevel, string> = {
    ZŠ: 'Úroveň: ZŠ — jednoduchý jazyk, základní kvíz.',
    SŠ: 'Úroveň: SŠ — akademický jazyk, středně těžký kvíz.',
    VŠ: 'Úroveň: VŠ — vědecký jazyk, obtížný kvíz.',
  }

  // Truncate only if truly enormous — effectively allows whole textbook chapters
  const truncated = userNotes.length > MAX_NOTES_CHARS
    ? userNotes.slice(0, MAX_NOTES_CHARS) + '\n[... zápisky zkráceny ...]'
    : userNotes

  return `${levelHint[level]}${buildExamGoalDirective(examGoal)}

Zápisky studenta (zpracuj VÝHRADNĚ tento obsah — nepřidávej nic navíc):
"""
${truncated}
"""

Na základě těchto zápisků vrať VÝHRADNĚ tento JSON:
{
  "introduction": "2–3 věty. Motivační úvod shrnující, o čem zápisky jsou — z pohledu studenta připravujícího se na zkoušku.",
  "tl_dr": "2 věty. Absolutní esence zápisků — nejdůležitější myšlenka nebo závěr, který ze zápisků plyne.",
  "deep_modules": [
    {
      "title": "Název prvního hlavního tématu ze zápisků",
      "explanation": "4–6 vět organizující a přepisující obsah zápisků k tomuto tématu. VÝHRADNĚ z zápisků — žádné přidané informace.",
      "analogy": "Jedna věta — analogie nebo přirovnání, které pomáhá pochopit tento koncept ze zápisků."
    },
    {
      "title": "Název druhého tématu ze zápisků",
      "explanation": "4–6 vět...",
      "analogy": "Jedna věta..."
    },
    {
      "title": "Název třetího tématu ze zápisků (pokud zápisky pokrývají více oblastí)",
      "explanation": "4–6 vět...",
      "analogy": "Jedna věta..."
    }
  ],
  "exam_traps": [
    "⚠️ [NÁZEV PASTI VELKÝMI]: Záměna nebo nejasnost přímo z obsahu zápisků. Většina studentů odpoví '[chybná odpověď z kontextu zápisků]', ale chyba, protože [vysvětlení ze zápisků]. Správně: [správná formulace].",
    "⚠️ [NÁZEV DRUHÉ PASTI]: ...",
    "⚠️ [NÁZEV TŘETÍ PASTI]: ..."
  ],
  "memory_hack": "Konkrétní akronym NEBO absurdní příběh navázaný na klíčové pojmy ze zápisků. ZAKÁZÁNO: obecné rady.",
  "interactive_quiz": [
    {
      "question": "Otázka testující informaci, která je explicitně v zápisech?",
      "options": ["Možnost A", "Možnost B", "Možnost C", "Možnost D"],
      "correct_index": 0,
      "explanation_why_correct": "Proč A je správně (odkazuje na konkrétní část zápisků) a proč ostatní možnosti jsou špatně."
    },
    { "question": "...", "options": ["...","...","...","..."], "correct_index": 1, "explanation_why_correct": "..." },
    { "question": "...", "options": ["...","...","...","..."], "correct_index": 2, "explanation_why_correct": "..." },
    { "question": "...", "options": ["...","...","...","..."], "correct_index": 3, "explanation_why_correct": "..." },
    { "question": "...", "options": ["...","...","...","..."], "correct_index": 0, "explanation_why_correct": "..." }
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
    { "term": "Pojem 1 ze zápisků", "definition": "Přesná definice nebo vysvětlení pojmu 1" },
    { "term": "Pojem 2", "definition": "Definice 2" },
    { "term": "Pojem 3", "definition": "Definice 3" },
    { "term": "Pojem 4", "definition": "Definice 4" },
    { "term": "Pojem 5", "definition": "Definice 5" },
    { "term": "Pojem 6", "definition": "Definice 6" },
    { "term": "Pojem 7", "definition": "Definice 7" },
    { "term": "Pojem 8", "definition": "Definice 8" },
    { "term": "Pojem 9", "definition": "Definice 9" },
    { "term": "Pojem 10", "definition": "Definice 10" }
  ],
  "mind_map_mermaid": "graph TD\\n  T[Hlavní téma] --> C1[Klíčový pojem 1]\\n  T --> C2[Klíčový pojem 2]\\n  T --> C3[Klíčový pojem 3]\\n  C1 --> S1[Detail]\\n  C2 --> S2[Detail]",
  "interactive_game": {
    "game_type": "matching",
    "title": "Spáruj pojmy ze zápisků",
    "instructions": "Vyber termín vlevo, pak správnou definici vpravo",
    "items": [
      {"left": "[Klíčový pojem 1 ze zápisků]", "right": "[Definice/vysvětlení 1]"},
      {"left": "[Klíčový pojem 2]", "right": "[Definice 2]"},
      {"left": "[Klíčový pojem 3]", "right": "[Definice 3]"},
      {"left": "[Klíčový pojem 4]", "right": "[Definice 4]"},
      {"left": "[Klíčový pojem 5]", "right": "[Definice 5]"},
      {"left": "[Klíčový pojem 6]", "right": "[Definice 6]"}
    ]
  }
}`
}

// ── Validation (same contract as generate-notes) ──────────────────────────────

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

  // podcast_script is optional but if present must be valid
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

  const { userNotes, level, examGoal = 'bezna-pisemka', targetLanguage } =
    body as { userNotes?: string; level?: StudyLevel; examGoal?: ExamGoal; targetLanguage?: string }

  const VALID_LEVELS: StudyLevel[] = ['ZŠ', 'SŠ', 'VŠ']
  const VALID_GOALS: ExamGoal[] = ['bezna-pisemka', 'prijimaci-zkousky', 'maturita', 'statni-zaverecne']

  if (!userNotes?.trim() || userNotes.trim().length < 20) {
    return NextResponse.json(
      { error: 'Zápisky jsou příliš krátké. Vložte alespoň 20 znaků.' },
      { status: 400 }
    )
  }
  if (!level || !VALID_LEVELS.includes(level)) {
    return NextResponse.json({ error: 'Chybí parametr level.' }, { status: 400 })
  }
  const safeGoal: ExamGoal = VALID_GOALS.includes(examGoal) ? examGoal : 'bezna-pisemka'

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
  } catch { /* auth unavailable */ }

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
      { role: 'user',   content: buildUserPrompt(userNotes.trim(), level, safeGoal) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5, // lower = more faithful to the input, less creative
    max_tokens: 7800, // podcast + flashcards + game + mind map
  })

  const raw = completion.choices[0].message.content
  if (!raw) {
    return NextResponse.json({ error: 'OpenAI vrátilo prázdnou odpověď.' }, { status: 500 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[generate-from-notes] JSON parse failed. Raw:\n', raw)
    return NextResponse.json({ error: 'OpenAI vrátilo neplatný JSON.' }, { status: 500 })
  }

  let notes: SmartNotes
  try {
    notes = validate(parsed)
  } catch (err) {
    console.error('[generate-from-notes] Validation failed:', err, '\nParsed:', JSON.stringify(parsed, null, 2))
    return NextResponse.json(
      { error: `Odpověď AI nesplnila schéma: ${(err as Error).message}` },
      { status: 500 }
    )
  }

  if (authedUserId) trackCreditUsed(authedUserId).catch(() => {})

  // Save to student_notes history — topic derived from AI introduction or truncated input
  if (authedUserId) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/admin')
      const topic = notes.introduction
        ? notes.introduction.slice(0, 60).replace(/\s+\S*$/, '…')
        : userNotes.trim().slice(0, 50).replace(/\s+\S*$/, '…')
      const { data: saved } = await supabaseAdmin
        .from('student_notes')
        .insert({ user_id: authedUserId, topic, level, notes_data: notes, raw_text: userNotes.trim().slice(0, 100_000) })
        .select('id')
        .single()
      if (saved?.id) return NextResponse.json({ ...notes, _note_id: saved.id })
    } catch { /* table columns not yet migrated — continue without saving */ }
  }

  return NextResponse.json(notes)
}
