import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getGradeCategory } from '@/lib/templates/generator'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function buildImagePrompt(topic: string, grade: string): string {
  const cat = getGradeCategory(grade)
  const style =
    cat === 'lower'
      ? 'friendly, colourful, cartoon-like illustration suitable for young children aged 6-9'
      : cat === 'middle'
      ? 'clean, engaging educational illustration with clear visual metaphors, suitable for ages 10-13'
      : 'detailed, sophisticated educational infographic illustration, suitable for teenagers and young adults'

  return (
    `A beautiful, vibrant educational illustration for a Czech school lesson about: "${topic}". ` +
    `Art style: ${style}. ` +
    `The image should visually represent the core concepts and atmosphere of the topic in a compelling way. ` +
    `Rich, harmonious colours. Professional educational material quality. ` +
    `Absolutely NO text, words, letters, or numbers anywhere in the image.`
  )
}

export async function POST(req: NextRequest) {
  if (!openai) {
    return NextResponse.json({ imageUrl: null })
  }

  const body = await req.json().catch(() => null)
  const { topic, grade } = (body ?? {}) as { topic?: string; grade?: string }

  if (!topic || !grade) {
    return NextResponse.json({ imageUrl: null })
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: buildImagePrompt(topic, grade),
      size: '1792x1024',
      quality: 'standard',
      n: 1,
    })

    const imageUrl = response.data?.[0]?.url ?? null
    return NextResponse.json({ imageUrl })
  } catch (err) {
    console.error('[DALL-E] Image generation failed:', err)
    return NextResponse.json({ imageUrl: null })
  }
}
