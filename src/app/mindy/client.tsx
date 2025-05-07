'use client'

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
      <ul className="space-y-4">
        {resources.map((resource) => (
          <li key={resource.id} className="border-b pb-2">
            <h2 className="text-xl font-semibold">{resource.title}</h2>
            <p className="text-muted-foreground">{resource.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
} 