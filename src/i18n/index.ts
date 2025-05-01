import type { Locale } from './settings'
import type { Dictionary } from './types'

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import('./locales/en.json').then((module) => module.default as Dictionary),
  'pt-BR': () => import('./locales/pt-BR.json').then((module) => module.default as Dictionary),
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  const dictionary = await dictionaries[locale]()
  return dictionary
} 