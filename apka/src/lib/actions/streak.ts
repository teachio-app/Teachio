'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Atomically updates the user's streak for today.
 * - Consecutive days (yesterday → today): streak + 1
 * - Gap of ≥ 1 day: reset to 1
 * - Same day as last active: no change
 *
 * Returns the current streak after the update, or 0 on any error.
 * Safe to call if the streak columns do not yet exist in the DB.
 */
export async function updateStreak(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const today = new Date().toISOString().split('T')[0]  // YYYY-MM-DD

    const { data: profile, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('current_streak, max_streak, last_active_date')
      .eq('id', user.id)
      .single()

    // Columns might not exist yet — return gracefully
    if (fetchErr || !profile) return 0

    const last   = (profile as Record<string, unknown>).last_active_date as string | null
    const cur    = ((profile as Record<string, unknown>).current_streak  as number) ?? 0
    const maxS   = ((profile as Record<string, unknown>).max_streak      as number) ?? 0

    // Already updated today
    if (last === today) return cur

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    const newStreak = last === yStr ? cur + 1 : 1
    const newMax    = Math.max(newStreak, maxS)

    await supabaseAdmin
      .from('profiles')
      .update({
        current_streak:   newStreak,
        max_streak:       newMax,
        last_active_date: today,
      })
      .eq('id', user.id)

    return newStreak
  } catch {
    // Columns missing or network error — never crash the app
    return 0
  }
}
