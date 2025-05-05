export type Product = {
  id: string
  name: string
  description: string | null
  type: string | null
  thumb: string | null
  file_url: string | null
  category: string | null
  software: string | null
  tags: string[] | null
  created_at: string
  images?: string[] | null
} 