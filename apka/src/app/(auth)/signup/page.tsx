import { signup } from '@/lib/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TeachioIllustration } from '@/components/ui/TeachioIllustration'
import Link from 'next/link'

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 65%, #4338ca 100%)' }}>

        {/* Blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[480px] h-[480px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute top-[35%] left-[5%] w-56 h-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-indigo-900 font-black text-lg">T</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Teachio</span>
        </div>

        {/* Illustration + stats */}
        <div className="relative flex flex-col items-center gap-8">
          <TeachioIllustration />
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
              { num: '8 předmětů', desc: 'inteligentně rozpoznáno' },
              { num: '100%', desc: 'zdarma pro začátek' },
            ].map((s) => (
              <div key={s.desc} className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-white font-bold text-xl">{s.num}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{s.desc}</p>
              </div>
            ))}
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

          <h1 className="text-2xl font-bold text-slate-900">Vytvořit účet ✏️</h1>
          <p className="text-slate-500 text-sm mt-1 mb-8">
            Začněte šetřit čas na přípravě hodin — zdarma
          </p>

          <form action={signup} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="vas@email.cz"
                required autoComplete="email" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Heslo</Label>
              <Input id="password" name="password" type="password" placeholder="Alespoň 6 znaků"
                required autoComplete="new-password" minLength={6} className="h-11" />
            </div>

            {params.error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <span className="shrink-0">⚠</span>
                <span>{decodeURIComponent(params.error)}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              Zaregistrovat se
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Již máte účet?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Přihlaste se
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
