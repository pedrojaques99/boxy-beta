import { useCallback, useEffect, useState } from 'react'

type Locale = 'en' | 'pt-BR'

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // Get locale from localStorage or browser
    const storedLocale = localStorage.getItem('locale') as Locale | null
    const browserLocale = navigator.language
    
    if (storedLocale) {
      setLocale(storedLocale)
    } else if (browserLocale.startsWith('pt')) {
      setLocale('pt-BR')
    } else {
      setLocale('en')
    }
  }, [])

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  return { locale, changeLocale }
} 