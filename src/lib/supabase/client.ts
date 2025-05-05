import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

// Manter uma única instância global do cliente
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Verificar se estamos no ambiente do navegador
  const isBrowser = typeof window !== 'undefined'
  
  // Se não estamos no navegador, retorna um objeto mock para evitar erros
  if (!isBrowser) {
    console.log('Tentativa de criar cliente Supabase no servidor, retornando mock')
    // @ts-ignore - retornando um mock simplificado para evitar erros
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
    }
  }
  
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