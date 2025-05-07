import type { Locale } from './settings'
import type { Dictionary } from './types'

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./locales/en.json').then((module) => module.default),
  'pt-BR': () => import('./locales/pt-BR.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  try {
    const dictionary = await dictionaries[locale]()
    return dictionary
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error)
    // Fallback to English if the requested locale fails to load
    if (locale !== 'en') {
      return dictionaries['en']()
    }
    throw error
  }
} 