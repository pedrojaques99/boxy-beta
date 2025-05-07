export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string
          description_en: string | null
          category: string
          subcategory: string
          software: string | null
          url: string
          thumbnail_url: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
          price_model: string | null
          featured: boolean
          approved: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          description_en?: string | null
          category: string
          subcategory: string
          software?: string | null
          url: string
          thumbnail_url?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          price_model?: string | null
          featured?: boolean
          approved?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          description_en?: string | null
          category?: string
          subcategory?: string
          software?: string | null
          url?: string
          thumbnail_url?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          price_model?: string | null
          featured?: boolean
          approved?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 