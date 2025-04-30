'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/settings'
import type { Dictionary } from '@/i18n/types'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'

export function useTranslations() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // Get locale from localStorage or fallback to browser language
    const savedLocale = localStorage.getItem('locale') as Locale
    const browserLocale = navigator.language as Locale
    const defaultLocale = i18n.defaultLocale
    
    // Use the first matching locale from our supported list
    const selectedLocale = [savedLocale, browserLocale, defaultLocale].find(
      locale => i18n.locales.includes(locale as any)
    ) as Locale || defaultLocale

    // Update HTML lang attribute
    document.documentElement.lang = selectedLocale
    setLocale(selectedLocale)

    // Load dictionary
    getDictionary(selectedLocale).then(setDictionary)
  }, [])

  // Listen for localStorage changes from other components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'locale' && event.newValue) {
        const newLocale = event.newValue as Locale
        if (i18n.locales.includes(newLocale as any)) {
          document.documentElement.lang = newLocale
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