/**
 * Categorias de erros de autenticação para melhor organização
 */
export enum AuthErrorCategory {
  // Erros de credenciais
  INVALID_CREDENTIALS = 'invalid_credentials',
  PASSWORD_MISMATCH = 'password_mismatch',
  USER_NOT_FOUND = 'user_not_found',
  
  // Erros de sessão
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALID = 'session_invalid',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  
  // Erros de OAuth
  OAUTH_ERROR = 'oauth_error',
  OAUTH_STATE_INVALID = 'oauth_state_invalid',
  OAUTH_CALLBACK_ERROR = 'oauth_callback_error',
  
  // Erros de cookie
  COOKIE_ERROR = 'cookie_error',
  
  // Erros de rede
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  
  // Erros de rate limit
  RATE_LIMITED = 'rate_limited',
  
  // Erros de permissão
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  
  // Falhas de segurança
  SECURITY_ERROR = 'security_error',
  
  // Outros
  UNEXPECTED_ERROR = 'unexpected_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Interface para erro de autenticação com informações detalhadas
 */
export interface AuthError {
  // Identificadores principais
  message: string;
  code?: string;
  
  // Categoria do erro para agrupamento
  category: AuthErrorCategory;
  
  // Dados adicionais
  originalError?: any;
  timestamp: Date;
  
  // Informações de resolução
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * Mapeamento de códigos de erro do Supabase para nossas categorias internas
 */
export const mapSupabaseErrorToCategory = (code?: string, message?: string): AuthErrorCategory => {
  if (!code && !message) return AuthErrorCategory.UNKNOWN_ERROR;

  // Mapear com base no código
  if (code) {
    switch (code) {
      case 'auth/invalid-email':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return AuthErrorCategory.INVALID_CREDENTIALS;
      
      case 'auth/email-already-in-use':
        return AuthErrorCategory.USER_NOT_FOUND;
      
      case 'auth/too-many-requests':
        return AuthErrorCategory.RATE_LIMITED;
      
      case 'auth/network-request-failed':
        return AuthErrorCategory.NETWORK_ERROR;
        
      case 'auth/internal-error':
        return AuthErrorCategory.SERVER_ERROR;
    }
  }
  
  // Mapear com base em palavras-chave na mensagem
  if (message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('invalid') && lowerMessage.includes('credentials'))
      return AuthErrorCategory.INVALID_CREDENTIALS;
    
    if (lowerMessage.includes('password') && lowerMessage.includes('incorrect'))
      return AuthErrorCategory.INVALID_CREDENTIALS;
    
    if (lowerMessage.includes('user') && lowerMessage.includes('not found'))
      return AuthErrorCategory.USER_NOT_FOUND;
    
    if (lowerMessage.includes('expired') && (lowerMessage.includes('token') || lowerMessage.includes('session')))
      return AuthErrorCategory.SESSION_EXPIRED;
    
    if (lowerMessage.includes('invalid') && lowerMessage.includes('token'))
      return AuthErrorCategory.TOKEN_INVALID;
    
    if (lowerMessage.includes('oauth') || lowerMessage.includes('state invalid'))
      return AuthErrorCategory.OAUTH_ERROR;
    
    if (lowerMessage.includes('cookie'))
      return AuthErrorCategory.COOKIE_ERROR;
    
    if (lowerMessage.includes('rate') && lowerMessage.includes('limit'))
      return AuthErrorCategory.RATE_LIMITED;
    
    if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden') || lowerMessage.includes('access denied'))
      return AuthErrorCategory.INSUFFICIENT_PERMISSIONS;
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection'))
      return AuthErrorCategory.NETWORK_ERROR;
    
    if (lowerMessage.includes('server') || lowerMessage.includes('internal'))
      return AuthErrorCategory.SERVER_ERROR;
  }
  
  return AuthErrorCategory.UNKNOWN_ERROR;
};

/**
 * Gerar sugestões de ação com base na categoria de erro
 */
export const getSuggestedAction = (category: AuthErrorCategory): string => {
  switch (category) {
    case AuthErrorCategory.INVALID_CREDENTIALS:
      return 'Verifique seu email e senha e tente novamente';
    
    case AuthErrorCategory.USER_NOT_FOUND:
      return 'Este usuário não existe. Verifique seu email ou crie uma nova conta';
    
    case AuthErrorCategory.SESSION_EXPIRED:
    case AuthErrorCategory.TOKEN_EXPIRED:
      return 'Sua sessão expirou. Por favor, faça login novamente';
    
    case AuthErrorCategory.SESSION_INVALID:
    case AuthErrorCategory.TOKEN_INVALID:
      return 'Há um problema com sua sessão. Por favor, faça login novamente';
    
    case AuthErrorCategory.OAUTH_ERROR:
    case AuthErrorCategory.OAUTH_STATE_INVALID:
    case AuthErrorCategory.OAUTH_CALLBACK_ERROR:
      return 'Ocorreu um erro durante a autenticação. Tente novamente ou use outro método de login';
    
    case AuthErrorCategory.COOKIE_ERROR:
      return 'Há um problema com os cookies do navegador. Certifique-se de que os cookies estão habilitados e tente novamente';
    
    case AuthErrorCategory.NETWORK_ERROR:
      return 'Verifique sua conexão de internet e tente novamente';
    
    case AuthErrorCategory.SERVER_ERROR:
      return 'Nossos servidores estão enfrentando problemas. Por favor, tente novamente mais tarde';
    
    case AuthErrorCategory.RATE_LIMITED:
      return 'Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente';
    
    case AuthErrorCategory.INSUFFICIENT_PERMISSIONS:
      return 'Você não tem permissão para acessar este recurso';
    
    case AuthErrorCategory.SECURITY_ERROR:
      return 'Detectamos um problema de segurança. Por favor, faça login novamente';
    
    default:
      return 'Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte';
  }
};

/**
 * Determinar se um erro é recuperável pelo usuário
 */
export const isRecoverableError = (category: AuthErrorCategory): boolean => {
  switch (category) {
    case AuthErrorCategory.INVALID_CREDENTIALS:
    case AuthErrorCategory.USER_NOT_FOUND:
    case AuthErrorCategory.SESSION_EXPIRED:
    case AuthErrorCategory.TOKEN_EXPIRED:
    case AuthErrorCategory.OAUTH_ERROR:
    case AuthErrorCategory.NETWORK_ERROR:
    case AuthErrorCategory.RATE_LIMITED:
      return true;
    
    default:
      return false;
  }
};

/**
 * Criar um objeto de erro detalhado
 */
export const createAuthError = (
  message: string, 
  category: AuthErrorCategory = AuthErrorCategory.UNKNOWN_ERROR,
  originalError?: any,
  code?: string
): AuthError => {
  const effectiveCategory = category || mapSupabaseErrorToCategory(code, message);
  
  return {
    message,
    code,
    category: effectiveCategory,
    originalError,
    timestamp: new Date(),
    recoverable: isRecoverableError(effectiveCategory),
    suggestedAction: getSuggestedAction(effectiveCategory)
  };
}; 