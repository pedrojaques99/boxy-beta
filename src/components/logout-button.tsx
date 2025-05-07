'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/use-translations'
import { getAuthService } from '@/lib/auth/auth-service'

export function LogoutButton() {
  const router = useRouter()
  const { t } = useTranslations()
  const authService = getAuthService()

  const logout = async () => {
    await authService.signOut()
    router.push('/auth/login')
  }

  if (!t) return null

  return <Button onClick={logout}>{t?.protected?.logout}</Button>
}
