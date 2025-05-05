import { createBrowserClient } from '@supabase/ssr'

// Store a single instance of the Supabase client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined'
  
  // If not in browser, return a mock to avoid errors
  if (!isBrowser) {
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any
  }
  
  // Return existing instance if available
  if (supabaseClient) return supabaseClient
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  try {
    // Create a new client
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    
    // Clear any corrupted cookies as a fallback
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim()
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
    }
    
    // Create a new client after clearing cookies
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  }
}