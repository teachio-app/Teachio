'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface UserProfile {
  credits: number
  is_pro: boolean
  role: 'teacher' | 'student' | null
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('credits, is_pro, role')
      .eq('id', user.id)
      .single()

    return data ?? null
  } catch {
    return null
  }
}

// ── Atomic credit guard (Step 4) ──────────────────────────────────────────────

/**
 * Checks AND decrements a credit in a single atomic DB transaction via RPC.
 * Uses the service-role client so the operation is never blocked by RLS.
 *
 * Returns:
 *   'ok'          — credit deducted, proceed with generation
 *   'no_credits'  — zero credits remaining
 *   'no_profile'  — profile row missing
 *   'error'       — unexpected DB error (allow generation as fallback)
 */
export async function tryUseCredit(
  userId: string
): Promise<'ok' | 'no_credits' | 'no_profile' | 'error'> {
  try {
    const { data, error } = await supabaseAdmin.rpc('try_use_credit', {
      p_user_id: userId,
    })
    if (error) {
      console.error('[credits] tryUseCredit RPC error:', error)
      return 'error'
    }
    return (data as 'ok' | 'no_credits' | 'no_profile') ?? 'error'
  } catch (err) {
    console.error('[credits] tryUseCredit unexpected error:', err)
    return 'error'
  }
}

// ── Legacy guard — kept for backward compatibility ─────────────────────────────

export async function checkCredits(userId: string): Promise<'ok' | 'no_credits' | 'no_auth'> {
  try {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, is_pro')
      .eq('id', userId)
      .single()

    if (!profile) return 'no_auth'
    if (profile.is_pro) return 'ok'
    if (profile.credits <= 0) return 'no_credits'
    return 'ok'
  } catch {
    return 'ok'
  }
}

// ── Deduct (called after successful generation) ───────────────────────────────

export async function deductCredit(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Read first to avoid going below 0
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, is_pro')
      .eq('id', userId)
      .single()

    if (!profile || profile.is_pro || profile.credits <= 0) return

    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', userId)
  } catch { /* non-fatal */ }
}

// ── Dev cheat (development only) ─────────────────────────────────────────────

export async function addTestCredits(): Promise<{ credits: number }> {
  if (process.env.NODE_ENV !== 'development') {
    return { credits: 0 }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { credits: 0 }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    const newCredits = (profile?.credits ?? 0) + 50

    await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id)

    return { credits: newCredits }
  } catch {
    return { credits: 0 }
  }
}
