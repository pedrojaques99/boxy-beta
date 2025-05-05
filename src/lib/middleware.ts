import { updateSession as updateSupabaseSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

/**
 * @deprecated Use '@/lib/supabase/middleware' directly instead.
 * This is a compatibility layer that redirects to the consolidated implementation.
 */
export async function updateSession(request: NextRequest) {
  console.warn('DEPRECATED: Using @/lib/middleware is deprecated. Import from @/lib/supabase/middleware instead.')
  return updateSupabaseSession(request)
}
