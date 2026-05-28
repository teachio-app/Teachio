import Link from 'next/link'
import { ClientProviders } from '@/components/ui/ClientProviders'

function MarketingNav() {
  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 16px rgba(124,58,237,0.35)' }}>
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">Teachio</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {[
            { href: '/#features', label: 'Funkce' },
            { href: '/#how', label: 'Jak to funguje' },
            { href: '/pricing', label: 'Ceny' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login"
            className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors">
            Přihlásit se
          </Link>
          <Link href="/signup"
            className="text-sm font-bold px-5 py-2.5 rounded-full text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
            Začít zdarma →
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <div style={{ background: '#f8f6ff', minHeight: '100vh' }}>
        <MarketingNav />
        <main className="max-w-5xl mx-auto px-6 py-12 pb-20">
          {children}
        </main>
        <footer className="text-center py-8 text-xs text-slate-400">
          © {new Date().getFullYear()} Teachio · Všechna práva vyhrazena
        </footer>
      </div>
    </ClientProviders>
  )
}
