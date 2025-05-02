import dynamic from 'next/dynamic'
import { AuthGuard } from '@/components/admin/AuthGuard'
import { useTranslations } from '@/hooks/use-translations'

// Lazy load the ProductsCRUD component
const ProductsCRUD = dynamic(() => import('@/components/admin/ProductsCRUD').then(mod => mod.ProductsCRUD), {
  loading: () => <div className="animate-pulse h-10 bg-gray-200 rounded" />
})

export default function CRUDPage() {
  const { t } = useTranslations()

  return (
    <AuthGuard>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t?.admin?.products?.title || 'Product Management'}</h1>
        </div>
        <ProductsCRUD />
      </div>
    </AuthGuard>
  )
} 