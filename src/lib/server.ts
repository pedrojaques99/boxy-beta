import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * @deprecated Use '@/lib/supabase/server' directly instead.
 * This is a compatibility layer that redirects to the consolidated implementation.
 */
export async function createClient() {
  console.warn('DEPRECATED: Using @/lib/server is deprecated. Import from @/lib/supabase/server instead.')
  return createSupabaseServerClient()
}
