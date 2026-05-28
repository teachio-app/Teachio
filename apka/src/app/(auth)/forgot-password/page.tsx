import { resetPassword } from '@/lib/actions/auth'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-xl" style={{ color: '#f4f4f8' }}>Teachio</span>
        </Link>

        <h1 className="text-2xl font-bold mb-1 text-center" style={{ color: '#f4f4f8' }}>Zapomenuté heslo</h1>
        <p className="text-sm mb-8 text-center" style={{ color: '#62627a' }}>
          Zadej svůj e-mail a pošleme ti odkaz pro reset hesla.
        </p>

        {params.error && (
          <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 mb-4"
            style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}>
            <span className="shrink-0">⚠</span>
            <span>{decodeURIComponent(params.error)}</span>
          </div>
        )}

        {params.message ? (
          <div>
            <div className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 mb-6"
              style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
              <span className="shrink-0">✓</span>
              <span>{decodeURIComponent(params.message)}</span>
            </div>
            <Link href="/login"
              className="block w-full h-12 rounded-full text-white font-bold text-sm text-center leading-[48px] transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 24px rgba(124,58,237,0.40)' }}>
              Zpět na přihlášení
            </Link>
          </div>
        ) : (
          <form action={resetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#a1a1b8' }}>
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base" style={{ color: '#62627a' }}>✉</span>
                <input id="email" name="email" type="email" placeholder="tvuj@email.cz"
                  required autoComplete="email"
                  className="auth-input w-full h-12 pl-10 pr-4 rounded-xl text-sm transition-all outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#f4f4f8' }}
                />
              </div>
            </div>

            <button type="submit"
              className="w-full h-12 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.01] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 24px rgba(124,58,237,0.40)' }}>
              Odeslat odkaz pro reset →
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-8" style={{ color: '#62627a' }}>
          <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: '#a78bfa' }}>
            ← Zpět na přihlášení
          </Link>
        </p>
      </div>
    </div>
  )
}
