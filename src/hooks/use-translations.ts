'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/i18n/settings'
import type { Dictionary } from '@/i18n/types'
import { getDictionary } from '@/i18n'

export function useTranslations() {
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // Get locale from headers set by middleware
    const locale = document.documentElement.lang as Locale || 'en'
    setLocale(locale)

    // Load dictionary
    getDictionary(locale).then(setDictionary)
  }, [])

  return { t: dictionary, locale }
} 