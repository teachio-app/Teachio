import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicShell } from '@/components/ui/PublicShell'
import { getArticleBySlug, getRelatedArticles, BLOG_ARTICLES, type BlogSection } from '@/lib/blog-data'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return BLOG_ARTICLES.map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: `${article.title} – Teachio Blog`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://apka-chi.vercel.app/blog/${slug}`,
    },
  }
}

function RenderSection({ s }: { s: BlogSection }) {
  const MUT = '#94a3b8'
  const TEXT = '#f1f5f9'
  const BD  = 'rgba(255,255,255,0.08)'
  const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }

  switch (s.type) {
    case 'h2':
      return <h2 style={{ ...serif, fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: TEXT, lineHeight: 1.25, marginTop: 36, marginBottom: 14 }}>{s.text}</h2>
    case 'p':
      return <p style={{ fontSize: 16, color: MUT, lineHeight: 1.8, marginBottom: 16 }}>{s.text}</p>
    case 'ul':
      return (
        <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 15, color: MUT, lineHeight: 1.7 }}>
              <span style={{ color: '#a78bfa', flexShrink: 0, marginTop: 3 }}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, fontSize: 15, color: MUT, lineHeight: 1.7 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'quote':
      return (
        <blockquote style={{ margin: '24px 0', padding: '20px 24px', background: 'rgba(124,58,237,0.08)', borderLeft: '3px solid #7c3aed', borderRadius: '0 12px 12px 0' }}>
          <p style={{ ...serif, fontSize: 17, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>{s.text}</p>
        </blockquote>
      )
    case 'tip':
      return (
        <div style={{ margin: '20px 0', padding: '16px 20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>{s.label}</div>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{s.text}</p>
        </div>
      )
    default:
      return null
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = getRelatedArticles(slug, article.tag)
  const serif: React.CSSProperties = { fontFamily: 'var(--font-playfair), Georgia, serif' }
  const TEXT = '#f1f5f9'
  const MUT  = '#94a3b8'
  const DIM  = '#475569'
  const BD   = 'rgba(255,255,255,0.08)'
  const BG2  = 'rgba(255,255,255,0.03)'

  return (
    <PublicShell compact>
      {/* Progress bar (decorative) */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg,${article.accentColor},#a855f7)`, transformOrigin: 'left', transform: 'scaleX(0.6)' }} />
      </div>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 32, fontSize: 13, color: DIM }}>
          <Link href="/blog" style={{ color: DIM, textDecoration: 'none' }}>Blog</Link>
          <span>/</span>
          <span style={{ color: article.accentColor }}>{article.tag}</span>
          <span>/</span>
          <span style={{ color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{article.title.split(' ').slice(0, 5).join(' ')}…</span>
        </nav>

        {/* Cover */}
        <div className="pub-au" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: article.coverGradient, borderRadius: 20, fontSize: 72, marginBottom: 40, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
          {article.coverEmoji}
        </div>

        {/* Header */}
        <div className="pub-au pub-au2">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 100, background: article.accentBg, border: `1px solid ${article.accentColor}33`, fontSize: 12, fontWeight: 700, color: article.accentColor }}>{article.tag}</span>
            <span style={{ fontSize: 13, color: DIM }}>{article.readTime} čtení</span>
            <span style={{ fontSize: 13, color: DIM }}>{article.date}</span>
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(26px,5vw,44px)', fontWeight: 900, color: TEXT, lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 20 }}>{article.title}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${BD}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: article.accentBg, border: `1px solid ${article.accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: article.accentColor }}>
              {article.author.split(' ').map(w => w[0]).join('')}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{article.author}</div>
              <div style={{ fontSize: 12, color: DIM }}>Teachio tým</div>
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="pub-au pub-au3">
          {article.sections.map((s, i) => (
            <RenderSection key={i} s={s} />
          ))}
        </div>

        {/* Share */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BD}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: MUT }}>Sdílet:</span>
          {['X (Twitter)', 'Facebook', 'Kopírovat odkaz'].map(s => (
            <button key={s} className="pub-share-btn" style={{ padding: '7px 16px', borderRadius: 10, background: BG2, border: `1px solid ${BD}`, color: MUT, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {s}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 48, padding: '40px', background: 'linear-gradient(135deg,rgba(79,46,220,0.20),rgba(124,58,237,0.15))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, textAlign: 'center' }}>
          <h3 style={{ ...serif, fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 10 }}>Hotovo? Pojď to zkusit.</h3>
          <p style={{ fontSize: 14, color: MUT, marginBottom: 20 }}>Zadej první téma — kvíz, podcast a flashkarty máš za 10 vteřin.</p>
          <Link href="/student" style={{ display: 'inline-flex', padding: '12px 28px', borderRadius: 100, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(124,58,237,0.40)' }}>
            Vyzkoušet Teachio →
          </Link>
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 80px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 20 }}>Související články</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {related.map(r => (
              <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                <div className="pub-card-hover" style={{ padding: '18px', borderRadius: 16, background: BG2, border: `1px solid ${BD}` }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{r.coverEmoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.accentColor, marginBottom: 6 }}>{r.tag}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.4 }}>{r.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PublicShell>
  )
}
