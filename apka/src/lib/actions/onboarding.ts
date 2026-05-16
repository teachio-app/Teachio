'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'teacher' | 'student'

export async function saveRole(role: UserRole): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user.id)

  if (error) {
    console.error('[onboarding] saveRole failed:', error)
    // Let the page re-render with the error rather than crashing
    return
  }

  revalidatePath('/', 'layout')
  redirect(role === 'teacher' ? '/teacher' : '/student')
}
