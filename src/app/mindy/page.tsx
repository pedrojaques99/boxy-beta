import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterMenu } from '@/components/ui/filter-menu'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Resource {
  id: string
  title: string
  url: string
  tags: string[]
  category: string
  subcategory: string
  created_at: string
}

export default async function ResourcesPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('resources')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  const { data: subcategories } = await supabase
    .from('resources')
    .select('subcategory')
    .not('subcategory', 'is', null)
    .order('subcategory')

  const { data: software } = await supabase
    .from('resources')
    .select('software')
    .not('software', 'is', null)
    .order('software')

  const filterOptions = {
    category: [...new Set(categories?.map(c => c.category) || [])],
    subcategory: [...new Set(subcategories?.map(s => s.subcategory) || [])],
    software: [...new Set(software?.map(s => s.software) || [])]
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resources</h1>
        <FilterMenu options={filterOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources?.map((resource: Resource) => (
          <Card key={resource.id} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="relative h-48">
              <Image
                src={`https://image.thum.io/get/${resource.url}`}
                alt={resource.title}
                fill
                className="object-cover rounded-t-lg"
              />
            </CardHeader>
            <CardContent className="flex-grow p-6">
              <h2 className="text-xl font-semibold mb-2">{resource.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <p>Category: {resource.category}</p>
                <p>Subcategory: {resource.subcategory}</p>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Link href={`/mindy/${resource.id}`} className="w-full">
                <Button className="w-full">See details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
