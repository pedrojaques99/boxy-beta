import { createClient as createSupabaseClient } from '@/lib/supabase/client'

// Re-export a função do client singleton
export function createClient() {
  return createSupabaseClient()
}
