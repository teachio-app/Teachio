'use client'

import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from 'react'

interface UMContext {
  enabled: boolean
  toggle:  () => void
}

const UniversityModeContext = createContext<UMContext>({
  enabled: false,
  toggle:  () => {},
})

const STORAGE_KEY = 'teachio_uni_mode'

export function UniversityModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    try { setEnabled(localStorage.getItem(STORAGE_KEY) === 'true') } catch {}
  }, [])

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  return (
    <UniversityModeContext.Provider value={{ enabled, toggle }}>
      {children}
    </UniversityModeContext.Provider>
  )
}

export function useUniversityMode(): UMContext {
  return useContext(UniversityModeContext)
}
