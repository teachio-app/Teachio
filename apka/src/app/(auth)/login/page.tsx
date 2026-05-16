import { login } from '@/lib/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TeachioIllustration } from '@/components/ui/TeachioIllustration'
import Link from 'next/link'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #6d28d9 100%)' }}>

        {/* Colourful blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
        <div className="absolute top-[40%] right-[10%] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-indigo-900 font-black text-lg">T</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Teachio</span>
        </div>

        {/* Illustration */}
        <div className="relative flex flex-col items-center gap-8">
          <TeachioIllustration />
          <div className="text-center space-y-2">
            <p className="text-white text-2xl font-semibold leading-snug">
              Vaším nástrojem pro<br />
              <span className="text-violet-300">skvělé hodiny</span>
            </p>
            <p className="text-indigo-200 text-sm">
              Plány hodin a kvízy za vteřiny. Bez AI. Bez kompromisů.
            </p>
          </div>
        </div>

        <p className="relative text-indigo-400 text-xs">© 2025 Teachio. Všechna práva vyhrazena.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">Teachio</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Vítejte zpět 👋</h1>
          <p className="text-slate-500 text-sm mt-1 mb-8">Přihlaste se ke svému učitelskému účtu</p>

          <form action={login} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="vas@email.cz"
                required autoComplete="email" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Heslo</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••"
                required autoComplete="current-password" className="h-11" />
            </div>

            {params.error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <span className="shrink-0">⚠</span>
                <span>{decodeURIComponent(params.error)}</span>
              </div>
            )}
            {params.message && (
              <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                <span className="shrink-0">✓</span>
                <span>{decodeURIComponent(params.message)}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              Přihlásit se
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Nemáte ještě účet?{' '}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Zaregistrujte se zdarma
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
