import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'

export default async function AuthCodeErrorPage() {
  const headersList = headers()
  const locale = (headersList.get('x-locale') || i18n.defaultLocale) as typeof i18n.locales[number]
  const t = await getDictionary(locale)

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-8 p-6">
      <div className="flex max-w-md flex-col gap-3 text-center">
        <h1 className="text-2xl font-semibold">{t.auth.error.title}</h1>
        <p className="text-muted-foreground">
          {t.auth.error.description}
        </p>
      </div>
      <Button asChild>
        <Link href="/auth/login">{t.auth.error.backToLogin}</Link>
      </Button>
    </div>
  )
} 