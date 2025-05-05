import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

// Manter uma única instância global do cliente
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Se já temos uma instância, retorná-la em vez de criar uma nova
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }
  
  // Criar nova instância se ainda não existe
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  
  // Debugging para verificar criação
  console.log('Nova instância do Supabase Client criada')
  
  return supabaseClientInstance
}