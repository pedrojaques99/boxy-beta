'use client'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface Resource {
  id: string
  title: string
  description: string
  category?: string | null
  subcategory?: string | null
  software?: string | null
}

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link href={`/mindy/${resource.id}`} className="block">
      <Card className="overflow-hidden group h-full">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {resource.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {resource.category && (
              <span className="rounded-full bg-secondary/10 text-secondary-foreground px-3 py-1 text-xs font-medium">
                {resource.category}
              </span>
            )}
            {resource.subcategory && (
              <span className="rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">
                {resource.subcategory}
              </span>
            )}
            {resource.software && (
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                {resource.software}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all">
            Ver detalhes
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
} 