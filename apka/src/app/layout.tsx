import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque, Playfair_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
})

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '700', '900'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Teachio – AI studijní asistent',
  description: 'Zadej téma nebo nahraj zápisky — Teachio za vteřiny vygeneruje kvízy, podcast, flashkarty i studijní plán. Zdarma pro studenty.',
  keywords: 'studijní asistent, AI, kvíz, flashkarty, podcast, studijní plán, maturita, zápisky',
  openGraph: {
    title: 'Teachio – AI studijní asistent',
    description: 'Uč se chytřeji. Zadej téma a Teachio vytvoří podcast, kvíz, flashkarty i studijní plán za 30 vteřin.',
    siteName: 'Teachio',
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teachio – AI studijní asistent',
    description: 'Uč se chytřeji s AI. Podcast, kvízy, flashkarty a studijní plán za 30 vteřin.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${inter.variable} ${bricolage.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: '#0a0a0f', color: '#f4f4f8' }}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
