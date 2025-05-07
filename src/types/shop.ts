export interface Product {
  id: string
  name: string
  description: string
  thumb: string
  category: string
  type: string | null
  software: string | null
  file_url: string | null
  tags: string[] | null
  created_at: string
}

export interface ShopTranslations {
  title: string
  viewDetails: string
  noProducts: string
  search: {
    placeholder: string
    noResults: string
    recentSearches: string
  }
  filters: {
    all: string
    category: string
    software: string
    type: string
    textures: string
    models: string
    materials: string
    hdris: string
    plugins: string
  }
}

export interface ShopFilters {
  category: string | null
  software: string | null
  sortBy: 'created_at' | 'name'
  sortOrder: 'asc' | 'desc'
  isFree: boolean
} 