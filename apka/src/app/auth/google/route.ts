import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Google přihlášení selhalo. Zkuste to znovu.'), origin)
    )
  }

  return NextResponse.redirect(data.url)
}
