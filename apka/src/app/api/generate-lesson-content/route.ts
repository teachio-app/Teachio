import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

export const maxDuration = 30

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(req: NextRequest) {
  try {
    const { subject, lessonTitle, phase, mainTask, dayNumber } = await req.json() as {
      subject: string
      lessonTitle: string
      phase?: string
      mainTask?: string
      dayNumber?: number
    }

    if (!subject?.trim() || !lessonTitle?.trim()) {
      return NextResponse.json({ error: 'Missing subject or lessonTitle' }, { status: 400 })
    }
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 })
    }

    const prompt = `Jsi Teachio, elitní AI studijní kouč pomáhající studentům připravit se na zkoušky.

Vytvoř detailní studijní obsah pro JEDNU konkrétní lekci studijního plánu.

LEKCE:
- Předmět: ${subject}
- Den: ${dayNumber ?? '?'}
- Fáze: ${phase ?? 'Studium'}
- Název lekce: ${lessonTitle}
- Popis úkolu: ${mainTask ?? 'Prostuduj toto téma'}

Vrať JSON s těmito poli:

1. specificSteps — pole 4–5 konkrétních, akčních kroků co přesně student v této lekci udělá.
   Každý krok musí být specifický pro "${lessonTitle}" v předmětu "${subject}".
   Piš ve 2. osobě sg. ("přečti", "napiš", "vysvětli sám sobě"…).

2. flashcardPrompt — pole 6–8 kartiček ve formátu "Pojem: Definice".
   Klíčové pojmy z "${lessonTitle}" v "${subject}" které student musí znát ke zkoušce.
   Pojmy musí být reálné odborné termíny, ne obecné rady.

3. interestingFact — jedna krátká (max 2 věty), opravdu překvapivá a zapamatovatelná informace
   o tématu "${lessonTitle}" v "${subject}" která studenta zaujme. Ne obecná trivia.

4. learningTip — jeden praktický, vědecky podložený tip (aktivní vybavování, rozložené opakování,
   Feynmanova metoda…) specifický pro typ obsahu v této lekci.

5. podcast_script — pole 8–12 replik dialogu mezi učitelkou a studentem vysvětlující klíčové pojmy
   z "${lessonTitle}" v "${subject}".
   - Celé v češtině, přirozené, konverzační (ne přednáška)
   - Pokrývá 3–4 nejdůležitější koncepty lekce
   - Student klade 1–2 doplňující otázky, učitelka odpovídá jasně
   - Každá replika: max 2 věty, max 80 slov
   - Formát každé repliky: { "speaker": "teacher"|"student", "text": "..." }
   - Začíná učitelka, střídají se

Vrať VÝHRADNĚ validní JSON. Žádný markdown, žádné code bloky.

JSON schéma:
{
  "specificSteps": ["string", "string", "string", "string"],
  "flashcardPrompt": ["Pojem: Definice", "Pojem: Definice"],
  "interestingFact": "string",
  "learningTip": "string",
  "podcast_script": [
    { "speaker": "teacher", "text": "string" },
    { "speaker": "student", "text": "string" }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Jsi Teachio, elitní AI studijní kouč.${TEACHIO_IDENTITY}` },
        { role: 'user',   content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
      max_tokens: 2800,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from OpenAI')

    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[generate-lesson-content]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
