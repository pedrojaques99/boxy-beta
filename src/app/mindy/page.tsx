import { getDictionary } from '@/i18n'
import { Locale, i18n } from '@/i18n/settings'
import MindyClient from './client'
import { headers } from 'next/headers'
import { Suspense } from 'react'

export default async function MindyPage() {
  const headersList = headers()
  const locale = (headersList.get('x-locale') || i18n.defaultLocale) as Locale
  const t = await getDictionary(locale)

  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <MindyClient t={t} />
      </Suspense>
    </main>
  )
}
