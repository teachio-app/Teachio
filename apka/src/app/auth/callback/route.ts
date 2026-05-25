import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles Supabase email-confirmation and magic-link redirects.
 * Supabase appends ?code=... to the configured Site URL + /auth/callback.
 * We exchange that code for a session, then send the user to onboarding or dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Exchange failed or no code — send back to login with error
  return NextResponse.redirect(
    new URL('/login?error=' + encodeURIComponent('Ověření se nezdařilo. Zkuste se zaregistrovat znovu.'), origin)
  )
}
