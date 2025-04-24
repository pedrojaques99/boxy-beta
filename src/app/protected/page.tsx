import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'

export default async function ProtectedPage() {
  const headersList = headers()
  const locale = (headersList.get('x-locale') || i18n.defaultLocale) as typeof i18n.locales[number]
  const t = await getDictionary(locale)
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        {t.protected.hello} <span>{data.user.email}</span>
      </p>
      <LogoutButton />
    </div>
  )
}
