'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'petulk.pech@gmail.com'

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export async function setUserCredits(userId: string, credits: number): Promise<{ ok: boolean; error?: string }> {
  if (!await verifyAdmin()) return { ok: false, error: 'Unauthorized' }
  const safe = Math.max(0, Math.round(credits))
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ credits: safe })
    .eq('id', userId)
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function addUserCredits(userId: string, amount: number): Promise<{ ok: boolean; newCredits?: number }> {
  if (!await verifyAdmin()) return { ok: false }
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single()
  const current = (profile?.credits as number) ?? 0
  const next = Math.max(0, current + Math.round(amount))
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ credits: next })
    .eq('id', userId)
  return error ? { ok: false } : { ok: true, newCredits: next }
}
