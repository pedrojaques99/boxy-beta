"use client"

import { AuthGuard } from '@/components/admin/AuthGuard'
import { useTranslations } from '@/hooks/use-translations'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Lazy load the PlanCreation component
const PlanCreation = dynamic(() => import('@/components/admin/PlanCreation').then(mod => mod.PlanCreation), {
  loading: () => <div className="animate-pulse h-10 bg-gray-200 rounded" />
})

export default function AdminPage() {
  const { t } = useTranslations()

  return (
    <AuthGuard>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t?.admin?.title || 'Admin Dashboard'}</h1>
          <div className="space-x-4">
            <Link href="/admin/crud">
              <Button variant="outline">
                {t?.admin?.products?.title || 'Manage Products'}
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-8">
          <PlanCreation />
        </div>
      </div>
    </AuthGuard>
  )
}
