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

  revalidatePath('/', 'layout')
  redirect('/generator')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || password.length < 6) {
    redirect('/signup?error=' + encodeURIComponent('Heslo musí mít alespoň 6 znaků.'))
  }

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent('Registrace selhala: ' + error.message))
  }

  redirect('/login?message=' + encodeURIComponent('Účet byl vytvořen. Přihlaste se.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
