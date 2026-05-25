'use server'

import { createClient } from '@/lib/supabase/server'
import type { LessonPlan, QuizItem, SmartNotes } from '@/types'

export interface SavedMaterial {
  id: string
  topic: string
  grade: string
  duration: number
  subject: string
  subject_label: string
  lesson_plan: LessonPlan
  quiz: QuizItem[]
  image_url: string | null
  created_at: string
}

export interface SavedStudentNote {
  id: string
  topic: string
  level: string
  notes_data: SmartNotes
  raw_text: string | null
  created_at: string
}

export async function getMaterials(): Promise<SavedMaterial[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('lessons')
      .select('id, topic, grade, duration, subject, subject_label, lesson_plan, quiz, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return []
    return (data ?? []) as SavedMaterial[]
  } catch {
    return []
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('lessons').delete().eq('id', id)
  } catch { /* non-fatal */ }
}

export async function getStudentNotes(): Promise<SavedStudentNote[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('student_notes')
      .select('id, topic, level, notes_data, raw_text, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return []
    return (data ?? []) as SavedStudentNote[]
  } catch {
    return []
  }
}

export async function deleteStudentNote(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('student_notes').delete().eq('id', id)
  } catch { /* non-fatal */ }
}
