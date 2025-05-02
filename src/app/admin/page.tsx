'use client'

import { ProductsCRUD } from '@/components/admin/ProductsCRUD'
import { PlanCreation } from '@/components/admin/PlanCreation'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { useTranslations } from '@/hooks/use-translations'

export default function AdminPage() {
  const { t } = useTranslations()

  return (
    <AuthGuard>
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-2xl font-bold">{t?.admin?.title || 'Admin Dashboard'}</h1>
        <div className="grid gap-8">
          <PlanCreation />
        </div>
      </div>
    </AuthGuard>
  )
}
