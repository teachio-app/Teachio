import { redirect } from 'next/navigation'
import LandingClient from './LandingClient'

export default async function LandingPage() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'teacher') redirect('/teacher')
      if (profile?.role === 'student') redirect('/student')
      redirect('/onboarding')
    }
  } catch {}

  return <LandingClient />
}
