import type { Metadata } from 'next'
import { PublicShell } from '@/components/ui/PublicShell'
import { BLOG_ARTICLES } from '@/lib/blog-data'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog – Teachio | Učení po našem',
  description: 'Tipy, příběhy a triky, jak učit chytřeji. Rady pro studenty i učitele.',
  openGraph: {
    title: 'Blog – Teachio',
    description: 'Tipy, příběhy a triky, jak učit chytřeji.',
    url: 'https://apka-chi.vercel.app/blog',
  },
}

const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
const BG2 = 'rgba(255,255,255,0.03)'
const BD  = 'rgba(255,255,255,0.08)'
const TEXT = '#f1f5f9'
const MUT  = '#94a3b8'
const DIM  = '#475569'

const TAGS = ['Vše', 'Tipy', 'Příběhy', 'Studium', 'Pro učitele', 'Novinky']

const [featured, ...rest] = BLOG_ARTICLES

export default function BlogPage() {
  return (
    <PublicShell>
      {/* ── HERO ── */}
      <section style={{ padding: '96px 24px 60px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
        <div className="pub-au pub-au1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: 28 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>📚 Blog</span>
        </div>
        <h1 className="pub-au pub-au2" style={{ ...serif, fontSize: 'clamp(36px,6vw,56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16, color: TEXT }}>
          Učení po našem.
        </h1>
        <p className="pub-au pub-au3" style={{ fontSize: 17, color: MUT, lineHeight: 1.68 }}>
          Tipy, příběhy a triky, jak učit chytřeji.
        </p>
      </section>

      {/* ── TAG FILTER (visual only) ── */}
      <section style={{ padding: '0 24px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TAGS.map((tag, i) => (
            <div key={tag} className="pub-au" style={{ animationDelay: `${0.04 * i}s`, padding: '7px 16px', borderRadius: 100, background: i === 0 ? 'rgba(124,58,237,0.20)' : BG2, border: i === 0 ? '1px solid rgba(124,58,237,0.35)' : `1px solid ${BD}`, fontSize: 13, fontWeight: 600, color: i === 0 ? '#a78bfa' : MUT, cursor: 'pointer' }}>
              {tag}
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        {/* ── FEATURED ARTICLE ── */}
        <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 40 }}>
          <div className="pub-au pub-card-hover" style={{ borderRadius: 24, overflow: 'hidden', border: `1px solid ${BD}`, background: BG2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Cover */}
            <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: featured.coverGradient, fontSize: 64 }}>
              {featured.coverEmoji}
            </div>
            {/* Content */}
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: 100, background: featured.accentBg, border: `1px solid ${featured.accentColor}33`, fontSize: 12, fontWeight: 700, color: featured.accentColor }}>{featured.tag}</span>
                <span style={{ fontSize: 12, color: DIM }}>{featured.readTime} čtení</span>
              </div>
              <h2 style={{ ...serif, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: TEXT, lineHeight: 1.25, marginBottom: 12 }}>{featured.title}</h2>
              <p style={{ fontSize: 15, color: MUT, lineHeight: 1.65, marginBottom: 20 }}>{featured.excerpt}</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: featured.accentBg, border: `1px solid ${featured.accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: featured.accentColor }}>
                  {featured.author.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{featured.author}</div>
                  <div style={{ fontSize: 12, color: DIM }}>{featured.date}</div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* ── ARTICLE GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {rest.map((article, i) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div className="pub-au pub-card-hover" style={{ animationDelay: `${0.06 * i}s`, borderRadius: 20, overflow: 'hidden', border: `1px solid ${BD}`, background: BG2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Cover */}
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: article.coverGradient, fontSize: 48 }}>
                  {article.coverEmoji}
                </div>
                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 100, background: article.accentBg, fontSize: 11, fontWeight: 700, color: article.accentColor }}>{article.tag}</span>
                    <span style={{ fontSize: 11, color: DIM }}>{article.readTime}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT, lineHeight: 1.35, flex: 1 }}>{article.title}</h3>
                  <p style={{ fontSize: 13, color: MUT, lineHeight: 1.6 }}>{article.excerpt}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${BD}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: article.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: article.accentColor }}>
                      {article.author.split(' ').map(w => w[0]).join('')}
                    </div>
                    <span style={{ fontSize: 12, color: DIM }}>{article.author} · {article.date}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  )
}
