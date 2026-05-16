import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import type { PodcastTurn } from '@/types'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const VOICES: Record<PodcastTurn['speaker'], 'nova' | 'onyx'> = {
  teacher: 'nova',
  student: 'onyx',
}
const MAX_TURN_CHARS = 800
const MAX_TURNS      = 20

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { podcast_script, record_id, record_type } =
    (body ?? {}) as {
      podcast_script?: PodcastTurn[]
      record_id?: string
      record_type?: 'lesson' | 'student_note'
    }

  if (!Array.isArray(podcast_script) || podcast_script.length === 0) {
    return NextResponse.json({ error: 'podcast_script array is required' }, { status: 400 })
  }
  if (!openai) {
    return NextResponse.json({ error: 'OpenAI API klíč není nakonfigurován.' }, { status: 500 })
  }

  const turns = podcast_script.slice(0, MAX_TURNS)

  // 1 — Generate all audio turns in parallel
  const rawResults = await Promise.all(
    turns.map(async (turn, i) => {
      const text = turn.text?.trim().slice(0, MAX_TURN_CHARS)
      if (!text) return { speaker: turn.speaker, audioBase64: '', index: i, storagePath: null }

      const speech = await openai!.audio.speech.create({
        model: 'tts-1',
        voice: VOICES[turn.speaker] ?? 'nova',
        input: text,
        speed: 1.0,
      })
      const buffer = Buffer.from(await speech.arrayBuffer())
      return { speaker: turn.speaker, audioBase64: buffer.toString('base64'), index: i }
    })
  )

  // 2 — Persist each turn to Supabase Storage (if record_id provided)
  const storagePaths: (string | null)[] = new Array(turns.length).fill(null)

  if (record_id && record_type) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Upload all non-empty turns in parallel
        await Promise.all(
          rawResults.map(async (result, i) => {
            if (!result.audioBase64) return
            const path = `${user.id}/${record_id}-turn-${i}.mp3`
            const buffer = Buffer.from(result.audioBase64, 'base64')

            await supabaseAdmin.storage
              .from('audio_records')
              .upload(path, buffer, {
                contentType: 'audio/mpeg',
                upsert: true,
              })

            storagePaths[i] = path
          })
        )

        // Save the array of paths and the podcast_script to the DB record
        const table = record_type === 'lesson' ? 'lessons' : 'student_notes'
        await supabaseAdmin
          .from(table)
          .update({
            podcast_urls:   storagePaths,
            podcast_script: podcast_script,
          })
          .eq('id', record_id)
          .eq('user_id', user.id)
      }
    } catch (err) {
      console.error('[tts/podcast] Storage upload failed (non-fatal):', err)
    }
  }

  return NextResponse.json({
    turns: rawResults.map((r, i) => ({
      speaker:      r.speaker,
      audioBase64:  r.audioBase64,
      storagePath:  storagePaths[i],
    })),
  })
}
