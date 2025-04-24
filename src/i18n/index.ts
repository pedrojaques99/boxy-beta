import type { Locale } from './settings'

const dictionaries = {
  en: () => import('./locales/en.json').then((module) => module.default),
  'pt-BR': () => import('./locales/pt-BR.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]() 