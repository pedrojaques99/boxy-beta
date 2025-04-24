import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { getDictionary } from '@/i18n'
import { i18n } from '@/i18n/settings'

type Product = {
  id: string
  name: string
  description: string | null
  type: string | null
  file_url: string | null
  category: string | null
  software: string | null
  tags: string[] | null
  created_at: string
}

async function getProducts() {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return products as Product[]
}

export default async function ShopPage() {
  const headersList = headers()
  const locale = (headersList.get('x-locale') || i18n.defaultLocale) as typeof i18n.locales[number]
  const t = await getDictionary(locale)
  const products = await getProducts()

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">{t.shop.title}</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition hover:shadow-lg"
          >
            {product.file_url && (
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={product.file_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{product.name}</h2>
                {product.type && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    {product.type}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {product.category && (
                  <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs text-secondary-foreground">
                    {product.category}
                  </span>
                )}
                {product.software && (
                  <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs text-secondary-foreground">
                    {product.software}
                  </span>
                )}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-end">
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {t.shop.viewDetails}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
