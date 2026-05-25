import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

export const maxDuration = 30

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const MAX_SCRIPT_CHARS = 4096

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { script, record_id, record_type } =
    (body ?? {}) as {
      script?: string
      record_id?: string               // DB record to update with audio_url
      record_type?: 'lesson' | 'student_note'
    }

  if (!script?.trim()) {
    return new Response(JSON.stringify({ error: 'No script provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  if (!openai) {
    return new Response(JSON.stringify({ error: 'OpenAI API klíč není nakonfigurován.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  // 1 — Generate audio
  const speech = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'onyx',
    input: script.trim().slice(0, MAX_SCRIPT_CHARS),
    speed: 1.0,
  })
  const buffer = Buffer.from(await speech.arrayBuffer())

  // 2 — Persist to Supabase Storage (if a record_id was provided)
  if (record_id && record_type) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const storagePath = `${user.id}/${record_id}-single.mp3`

        // Upload via admin client — service role bypasses per-request auth issues
        await supabaseAdmin.storage
          .from('audio_records')
          .upload(storagePath, buffer, {
            contentType: 'audio/mpeg',
            upsert: true,           // overwrite if re-generated
          })

        // Save the storage path back to the correct table
        const table = record_type === 'lesson' ? 'lessons' : 'student_notes'
        await supabaseAdmin
          .from(table)
          .update({ audio_url: storagePath })
          .eq('id', record_id)
          .eq('user_id', user.id)   // double-check ownership
      }
    } catch (err) {
      console.error('[tts] Storage upload failed (non-fatal):', err)
      // Fall through — still return the audio to the client
    }
  }

  // 3 — Return audio buffer for immediate playback
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
