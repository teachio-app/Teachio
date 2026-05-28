import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)

  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=/onboarding`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })

    if (error || !data.url) {
      console.error('[auth/google]', error)
      return NextResponse.redirect(
        new URL('/login?error=' + encodeURIComponent('Google přihlášení se nezdařilo. Zkus to znovu.'), origin)
      )
    }

    return NextResponse.redirect(data.url)
  } catch (err) {
    console.error('[auth/google]', err)
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Nastala chyba. Zkus to znovu.'), origin)
    )
  }
}
