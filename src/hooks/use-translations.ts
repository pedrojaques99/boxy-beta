'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/settings'
import type { Dictionary } from '@/i18n/types'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'

export type Translations = {
  navigation: {
    about: string
    shop: string
    labs: string
    mindy: string
    pricing: string
    switchToEnglish: string
    switchToPortuguese: string
    toggleTheme: string
    myAccount: string
    signOut: string
    signIn: string
    getStarted: string
  }
  // ... existing code ...
}

export function useTranslations() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, use the default locale
    if (typeof window === 'undefined') {
      return i18n.defaultLocale
    }

    // Get locale from localStorage or fallback to browser language
    const savedLocale = localStorage.getItem('locale') as Locale
    const browserLocale = navigator.language as Locale
    
    // Use the first matching locale from our supported list
    return [savedLocale, browserLocale, i18n.defaultLocale].find(
      (loc): loc is Locale => i18n.locales.includes(loc as Locale)
    ) || i18n.defaultLocale
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }

    // Load dictionary
    getDictionary(locale).then(setDictionary)
  }, [locale])

  // Listen for localStorage changes from other components
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'locale' && event.newValue) {
        const newLocale = event.newValue as Locale
        if (i18n.locales.includes(newLocale as Locale)) {
          if (typeof document !== 'undefined') {
            document.documentElement.lang = newLocale
          }
          setLocale(newLocale)
          getDictionary(newLocale).then(setDictionary)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { t: dictionary, locale }
} 