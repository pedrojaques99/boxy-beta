'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/settings'
import type { Dictionary } from '@/i18n/types'
import { i18n } from '@/i18n/settings'

export type TranslationsResult = {
  t: Dictionary | null
  locale: Locale
  setLocale: (locale: Locale) => void
}

export function useTranslations(): TranslationsResult {
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
    const loadDictionary = async () => {
      try {
        const module = await import(`@/i18n/locales/${locale}.json`)
        const dict = module.default
        // Ensure the loaded dictionary has all required fields
        if (!dict.home?.about) {
          dict.home = {
            ...dict.home,
            about: {
              title: '',
              description: '',
              subtitle: '',
              team: { title: '', subtitle: '' },
              cta: { title: '', description: '', button: '' }
            }
          }
        }
        setDictionary(dict as Dictionary)
      } catch (error) {
        console.error(`Failed to load dictionary for locale: ${locale}`, error)
        // Fallback to English if the requested locale fails to load
        if (locale !== 'en') {
          const enModule = await import('@/i18n/locales/en.json')
          setDictionary(enModule.default as Dictionary)
        }
      }
    }

    loadDictionary()
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
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { t: dictionary, locale, setLocale }
} 