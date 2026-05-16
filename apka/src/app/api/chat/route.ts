import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { TEACHIO_IDENTITY } from '@/lib/teachioIdentity'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MAX_CONTEXT_CHARS = 12_000
const MAX_HISTORY       = 20

const LANG_NAMES: Record<string, string> = {
  cz: 'Czech', en: 'English', de: 'German', fr: 'French',
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return new Response('Invalid request body', { status: 400 })

  const { messages, documentContext, targetLanguage } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    documentContext?: string
    targetLanguage?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages array required', { status: 400 })
  }
  if (!openai) {
    return new Response(JSON.stringify({ error: 'OpenAI not configured' }), { status: 500 })
  }

  const langName = LANG_NAMES[targetLanguage ?? 'cz'] ?? 'Czech'
  const context  = documentContext?.trim().slice(0, MAX_CONTEXT_CHARS) ?? ''

  const systemPrompt = context
    ? `You are Teachio, an elite, friendly educational mentor. Your primary goal is to help the user understand the following document:${TEACHIO_IDENTITY}

---
${context}
---

Answer their questions based primarily on this document. If they ask about something outside the context, answer it helpfully but note it is additional information beyond the document.

LANGUAGE: Always respond strictly in ${langName}. Never switch languages mid-response.
STYLE: Conversational, encouraging, concise (3–6 sentences unless more depth is needed). Format key concepts in **bold**. Never just repeat the document — explain, clarify, give examples.`
    : `You are Teachio, an elite educational mentor.${TEACHIO_IDENTITY} Answer educational questions clearly and encouragingly. Respond strictly in ${langName}.`

  const history = messages.slice(-MAX_HISTORY)

  const abortCtrl = new AbortController()

  try {
    const completion = await openai.chat.completions.create(
      {
        model:       'gpt-4o-mini',
        messages:    [{ role: 'system', content: systemPrompt }, ...history],
        stream:      true,
        temperature: 0.7,
        max_tokens:  800,
      },
      { signal: abortCtrl.signal }
    )

    const stream = new ReadableStream({
      async start(ctrl) {
        const enc = new TextEncoder()
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content
            if (text) ctrl.enqueue(enc.encode(text))
          }
        } catch (err) {
          // AbortError is expected on client disconnect — swallow it
          if ((err as Error).name !== 'AbortError') {
            console.error('[chat] stream error:', err)
          }
        } finally {
          ctrl.close()
        }
      },
      cancel() {
        abortCtrl.abort()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':            'text/plain; charset=utf-8',
        'Cache-Control':           'no-cache',
        'X-Accel-Buffering':       'no',  // disable nginx buffering for streaming
        'X-Content-Type-Options':  'nosniff',
      },
    })
  } catch (err) {
    console.error('[chat] request failed:', err)
    return new Response('Chat request failed', { status: 500 })
  }
}
