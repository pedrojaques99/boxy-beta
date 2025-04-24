'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/use-translations'

export function LogoutButton() {
  const router = useRouter()
  const { t } = useTranslations()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!t) return null

  return <Button onClick={logout}>{t.protected.logout}</Button>
}
