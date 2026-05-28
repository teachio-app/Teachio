import { signup } from '@/lib/actions/auth'
import Link from 'next/link'

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0f' }}>

      {/* ── Left panel — brand ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0d0d1a 0%,#13102a 40%,#1a1135 100%)' }}>

        {/* Ambient orbs */}
        <div className="absolute" style={{ width:'600px', height:'500px', top:'-150px', right:'-100px', background:'radial-gradient(ellipse,rgba(168,85,247,0.22) 0%,transparent 65%)', filter:'blur(70px)', pointerEvents:'none' }} />
        <div className="absolute" style={{ width:'400px', height:'400px', bottom:'-100px', left:'-50px', background:'radial-gradient(ellipse,rgba(99,102,241,0.18) 0%,transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div className="absolute" style={{ width:'300px', height:'300px', top:'35%', left:'5%', background:'radial-gradient(ellipse,rgba(52,211,153,0.08) 0%,transparent 65%)', filter:'blur(50px)', pointerEvents:'none' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
            <span className="text-white font-black text-lg">T</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Teachio</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-10">
          <div>
            <h2 className="text-4xl font-black text-white mb-3 leading-tight"
              style={{ fontFamily: 'var(--font-bricolage, Inter), sans-serif', letterSpacing: '-0.03em' }}>
              Připoj se ke komunitě 🚀
            </h2>
            <p className="text-base" style={{ color: '#a1a1b8' }}>
              Přidej se k 12 000+ studentů, kteří se učí chytřeji.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: '⚡', text: 'Výpisky, kvízy a podcast za 30 sekund' },
              { icon: '🗓️', text: 'Studijní plán přizpůsobený tvému termínu' },
              { icon: '💎', text: '48 kreditů zdarma každý měsíc' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(124,58,237,0.30)' }}>
                  <span className="text-sm">{b.icon}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: '#d1d5e8' }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { num: '12 000+', label: 'studentů' },
              { num: '100%', label: 'zdarma na začátek' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xl font-black text-white">{s.num}</p>
                <p className="text-xs mt-0.5" style={{ color: '#a1a1b8' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: '#62627a' }}>© 2025 Teachio. Všechna práva vyhrazena.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: '#0a0a0f' }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-xl" style={{ color: '#f4f4f8' }}>Teachio</span>
          </Link>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-2xl mb-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Link href="/login" className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl transition-colors hover:text-white"
              style={{ color: '#62627a' }}>
              Přihlásit se
            </Link>
            <div className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
              Registrace
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#f4f4f8' }}>Vytvořit účet</h1>
          <p className="text-sm mb-8" style={{ color: '#62627a' }}>Začni zdarma — žádná kreditní karta</p>

          <form action={signup} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a1a1b8' }}>
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: '#62627a' }}>✉</span>
                <input id="email" name="email" type="email" placeholder="tvuj@email.cz"
                  required autoComplete="email"
                  className="w-full h-12 pl-10 pr-4 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#f4f4f8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7c3aed'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.20)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a1a1b8' }}>
                Heslo
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: '#62627a' }}>🔒</span>
                <input id="password" name="password" type="password" placeholder="Alespoň 6 znaků"
                  required autoComplete="new-password" minLength={6}
                  className="w-full h-12 pl-10 pr-4 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#f4f4f8',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7c3aed'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.20)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* School type */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a1a1b8' }}>
                Typ školy
              </p>
              <div className="flex gap-2">
                {[
                  { value: 'zs', label: '🏫 ZŠ' },
                  { value: 'ss', label: '📚 SŠ' },
                  { value: 'vs', label: '🎓 VŠ' },
                ].map(opt => (
                  <label key={opt.value} className="flex-1 relative cursor-pointer">
                    <input type="radio" name="schoolType" value={opt.value} className="sr-only peer" defaultChecked={opt.value === 'ss'} />
                    <div className="py-2.5 text-center text-sm font-semibold rounded-xl border transition-all peer-checked:border-violet-500 peer-checked:text-violet-300 cursor-pointer hover:border-violet-400/50"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        color: '#a1a1b8',
                      }}>
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {params.error && (
              <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3"
                style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}>
                <span className="shrink-0">⚠</span>
                <span>{decodeURIComponent(params.error)}</span>
              </div>
            )}

            <button type="submit"
              className="w-full h-12 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 24px rgba(124,58,237,0.40)' }}>
              Vytvořit účet →
            </button>

            <p className="text-center text-xs" style={{ color: '#62627a' }}>
              Registrací souhlasíš s{' '}
              <a href="/terms" className="underline underline-offset-2 hover:opacity-80" style={{ color: '#a1a1b8' }}>Podmínkami použití</a>
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs" style={{ color: '#62627a' }}>nebo</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Google */}
          <Link href="/auth/google"
            className="flex items-center justify-center gap-3 w-full h-12 rounded-full font-semibold text-sm transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#f4f4f8' }}>
            <span className="text-lg">🌐</span>
            Pokračovat přes Google
          </Link>

          <p className="text-center text-sm mt-8" style={{ color: '#62627a' }}>
            Máš účet?{' '}
            <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#a78bfa' }}>
              Přihlásit se →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
