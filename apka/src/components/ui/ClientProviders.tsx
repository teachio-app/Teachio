'use client'

/**
 * All client-side context providers live here.
 * Imported by the server layout — keeps the server/client boundary explicit.
 */

import { type ReactNode } from 'react'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { UniversityModeProvider } from '@/lib/UniversityModeContext'

interface Props { children: ReactNode }

export function ClientProviders({ children }: Props) {
  return (
    <LanguageProvider>
      <UniversityModeProvider>
        {children}
      </UniversityModeProvider>
    </LanguageProvider>
  )
}
