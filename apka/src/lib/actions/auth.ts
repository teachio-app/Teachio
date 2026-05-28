'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    const message = error.message.includes('Email not confirmed')
      ? 'E-mail ještě nebyl potvrzen. Zkontrolujte svou schránku.'
      : 'Nesprávný e-mail nebo heslo.'
    redirect(`/login?error=${encodeURIComponent(message)}`)
  }

  // Redirect to the correct dashboard based on role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  revalidatePath('/', 'layout')
  const role = profile?.role as 'teacher' | 'student' | null
  redirect(role === 'student' ? '/student' : role === 'teacher' ? '/teacher' : '/onboarding')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || password.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('Heslo musí mít alespoň 6 znaků.'))
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apka-chi.vercel.app'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent('Registrace selhala: ' + error.message))
  }

  // Supabase returns success with empty identities when email is already registered
  if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
    redirect('/signup?error=' + encodeURIComponent('Tento e-mail je již zaregistrován. Přihlaš se nebo použij jiný e-mail.'))
  }

  // If Supabase returned a session immediately, email confirmation is disabled → go straight in
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/onboarding')
  }

  // Email confirmation required → tell user to check their inbox
  redirect('/login?message=' + encodeURIComponent('Účet vytvořen! Zkontroluj e-mail a klikni na potvrzovací odkaz.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Zadej prosím svůj e-mail.'))
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apka-chi.vercel.app'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent('Nepodařilo se odeslat e-mail. Zkus to znovu.'))
  }

  redirect('/forgot-password?message=' + encodeURIComponent('Odkaz pro reset hesla byl odeslán na ' + email + '. Zkontroluj svou schránku.'))
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  if (!password || password.length < 6) {
    redirect('/update-password?error=' + encodeURIComponent('Heslo musí mít alespoň 6 znaků.'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/update-password?error=' + encodeURIComponent('Nepodařilo se změnit heslo. Zkus to znovu.'))
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=' + encodeURIComponent('Heslo bylo úspěšně změněno. Přihlaš se.'))
}
