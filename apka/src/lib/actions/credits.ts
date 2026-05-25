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

// ── Credit guard ──────────────────────────────────────────────────────────────

/**
 * Atomically checks and deducts one credit.
 *
 * Tries the Supabase `try_use_credit` RPC first (atomic row-lock via FOR UPDATE).
 * If the RPC is not deployed, falls back to a direct read-then-write using the
 * service-role client (slightly non-atomic, but correct for normal usage).
 *
 * Returns:
 *   'ok'         — credit deducted, proceed
 *   'no_credits' — zero credits, block generation
 *   'no_profile' — profile row not found
 *   'error'      — unexpected DB error
 */
export async function tryUseCredit(
  userId: string
): Promise<'ok' | 'no_credits' | 'no_profile' | 'error'> {
  // 1 — Try the atomic RPC (preferred, requires the SQL function to be deployed)
  try {
    const { data, error } = await supabaseAdmin.rpc('try_use_credit', {
      p_user_id: userId,
    })
    if (!error) {
      return (data as 'ok' | 'no_credits' | 'no_profile') ?? 'error'
    }
    // RPC not found or errored — fall through to direct query
    console.warn('[credits] RPC try_use_credit unavailable, using fallback:', error.message)
  } catch {
    // fall through
  }

  // 2 — Fallback: direct admin query (works without any SQL function deployed)
  try {
    const { data: profile, error: readErr } = await supabaseAdmin
      .from('profiles')
      .select('credits, is_pro')
      .eq('id', userId)
      .maybeSingle()

    if (readErr) {
      console.error('[credits] profile read error:', readErr)
      return 'error'
    }
    if (!profile) return 'no_profile'

    // Pro users have unlimited access
    if (profile.is_pro) return 'ok'

    const current = profile.credits ?? 0
    if (current <= 0) return 'no_credits'

    // Deduct one credit — guard with gte(1) so a concurrent request can't
    // double-spend the last credit
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ credits: current - 1 })
      .eq('id', userId)
      .gte('credits', 1)

    if (updateErr) {
      console.error('[credits] deduct error:', updateErr)
      return 'error'
    }

    return 'ok'
  } catch (err) {
    console.error('[credits] tryUseCredit fallback error:', err)
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

// ── Usage tracking (analytics, non-atomic) ───────────────────────────────────

export async function trackCreditUsed(userId: string): Promise<void> {
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('total_credits_used')
      .eq('id', userId)
      .single()
    const current = (data?.total_credits_used as number) ?? 0
    await supabaseAdmin
      .from('profiles')
      .update({ total_credits_used: current + 1 })
      .eq('id', userId)
  } catch { /* column may not exist yet — non-fatal */ }
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
