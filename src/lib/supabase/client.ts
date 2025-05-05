import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

// Manter uma única instância global do cliente
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null

// Função para sanitizar cookies
const sanitizeSupabaseCookies = () => {
  if (typeof document === 'undefined') return;
  
  try {
    const cookies = document.cookie.split(';');
    let hasInvalidCookies = false;
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=').map(s => s.trim());
      
      // Verificar se é um cookie do Supabase
      if (name && (name.includes('supabase') || name.includes('sb-'))) {
        try {
          // Tentar validar JSON se começar com {
          if (value && value.startsWith('{')) {
            JSON.parse(value);
          }
          // Tentar validar base64 se começar com base64-
          else if (value && value.startsWith('base64-')) {
            const base64Part = value.substring(7);
            try {
              atob(base64Part);
            } catch (e) {
              // Base64 inválido, remover cookie
              console.warn(`Removendo cookie corrupto ${name} (base64 inválido)`);
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              hasInvalidCookies = true;
            }
          }
        } catch (e) {
          // JSON ou parsing inválido, remover cookie
          console.warn(`Removendo cookie corrupto ${name}`);
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          hasInvalidCookies = true;
        }
      }
    });
    
    return hasInvalidCookies;
  } catch (err) {
    console.error('Erro ao sanitizar cookies:', err);
    return false;
  }
};

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
  
  // Sanitizar cookies para prevenir erros de parsing
  const hadInvalidCookies = sanitizeSupabaseCookies();
  if (hadInvalidCookies) {
    console.log('Alguns cookies inválidos foram removidos. Recarregando a instância do cliente Supabase.');
    supabaseClientInstance = null;
  }
  
  // Se já temos uma instância, retorná-la em vez de criar uma nova
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }
  
  // Criar nova instância se ainda não existe
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  
  try {
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    
    // Debugging para verificar criação
    console.log('Nova instância do Supabase Client criada')
    
    return supabaseClientInstance
  } catch (err) {
    console.error('Erro ao criar cliente Supabase:', err);
    
    // Limpar todos os cookies relacionados ao Supabase e tentar novamente
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.includes('supabase') || name.includes('sb-')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    
    // Retornar cliente em último caso
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
}