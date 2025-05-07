'use client'

import { ResourceCard } from '@/components/mindy/resource-card'

interface Resource {
  id: string
  title: string
  description: string
}

interface ResourcesClientProps {
  resources: Resource[]
}

export function ResourcesClient({ resources = [] }: ResourcesClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recursos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  )
} 