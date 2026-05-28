import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_PAGES       = ['/login', '/signup']
const PUBLIC_PATHS     = ['/', ...AUTH_PAGES]  // always public — landing + auth
const TEACHER_PREFIXES = ['/teacher', '/generator', '/profil']
const STUDENT_PREFIXES = ['/student']
const SHARED_PREFIXES  = ['/profil']   // accessible by both roles

function isUnderPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // ── Auth check ────────────────────────────────────────────────────────────
  // Wrapped in try-catch: if Supabase is unreachable (network error, edge
  // timeout) we treat the user as unauthenticated and let the request through
  // rather than returning a 500 that makes nav buttons appear broken.
  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unavailable — fail open (public routes remain accessible)
  }
  const { pathname } = request.nextUrl

  // Non-authenticated users can only reach public paths
  const isProtected =
    isUnderPrefix(pathname, TEACHER_PREFIXES) ||
    isUnderPrefix(pathname, STUDENT_PREFIXES) ||
    pathname === '/onboarding'

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged-in users don't need auth pages
  if (user && AUTH_PAGES.includes(pathname)) {
    // Will be redirected below after role check
  }

  // ── Role check (only for authenticated users on protected paths) ──────────
  if (user) {
    // Fetch role — lightweight single-column lookup on indexed PK
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as 'teacher' | 'student' | null | undefined

    // 1. No role yet → force onboarding (except if already there)
    if (!role && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // 2. Has role → leave onboarding and go to dashboard
    if (role && pathname === '/onboarding') {
      return NextResponse.redirect(
        new URL(role === 'teacher' ? '/teacher' : '/student', request.url)
      )
    }

    // 3. Auth pages → redirect to role-appropriate dashboard
    if (role && AUTH_PAGES.includes(pathname)) {
      return NextResponse.redirect(
        new URL(role === 'teacher' ? '/teacher' : '/student', request.url)
      )
    }

    // 4. Role isolation — teachers can't visit student routes and vice-versa
    if (role === 'teacher' && isUnderPrefix(pathname, STUDENT_PREFIXES)) {
      return NextResponse.redirect(new URL('/teacher', request.url))
    }
    if (role === 'student' && isUnderPrefix(pathname, TEACHER_PREFIXES) &&
        !isUnderPrefix(pathname, SHARED_PREFIXES)) {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/teacher/:path*',
    '/student/:path*',
    '/generator/:path*',
    '/profil/:path*',
    '/onboarding',
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
  ],
}
