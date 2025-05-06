import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Store a single instance of the Supabase client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Cookie handling utilities
const cookieHandler = {
  get(name: string) {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
    return cookie ? cookie.split('=')[1] : undefined
  },
  set(name: string, value: string, options?: { maxAge?: number }) {
    document.cookie = `${name}=${value}; path=/; ${options?.maxAge ? `max-age=${options.maxAge}` : ''}`
  },
  remove(name: string) {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

// Clear corrupted cookies
const clearCorruptedCookies = () => {
  if (typeof document === 'undefined') return
  
  const cookies = document.cookie.split(';')
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim()
    if (name.includes('supabase') || name.includes('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  })
}

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
    // Create a new client with proper cookie handling
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: cookieHandler,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    return supabaseClient
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    
    // Clear any corrupted cookies as a fallback
    clearCorruptedCookies()
    
    // Create a new client after clearing cookies
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: cookieHandler,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    return supabaseClient
  }
}