export interface Resource {
  id: string
  title: string
  url: string
  thumbnail_url: string
  description: string
  category: string
  subcategory: string
  software: string
  description_pt: string
  description_en: string
  created_by: string
  tags?: string[]
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export interface MindyTranslations {
  title: string
  filters: {
    category: string
    subcategory: string
    software: string
  }
  search: {
    placeholder: string
    noResults: string
    recentSearches: string
  }
  details: {
    title: string
    description: string
    createdBy: string
    visitResource: string
    comments: string
    relatedResources: string
    seeDetails: string
  }
}

export interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  resource_id: string
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export interface ResourcesResponse {
  resources: Resource[]
  total: number
}

export interface SearchResponse {
  resources: Resource[]
  query: string
  total: number
}

export interface ResourceResponse {
  resource: Resource
  comments: Comment[]
  relatedResources: Resource[]
}

export interface SearchParams {
  q?: string
  category?: string
  software?: string
  subcategory?: string
  page?: number
  limit?: number
} 