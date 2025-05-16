import { AuthError, AuthErrorCategory } from '../auth/auth-errors';

/**
 * Níveis de log para diferentes tipos de eventos
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Classe para gerenciar logs de autenticação
 */
export class AuthLogger {
  private static instance: AuthLogger;
  private readonly MAX_LOG_SIZE = 100;
  private logs: Array<{
    level: LogLevel;
    timestamp: Date;
    message: string;
    data?: any;
  }> = [];
  
  private constructor() {
    // Singleton
  }
  
  /**
   * Obter a instância do logger
   */
  public static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }
  
  /**
   * Registrar um erro de autenticação
   */
  public logAuthError(error: AuthError, userId?: string): void {
    // Determinar o nível de log com base na categoria do erro
    const level = this.getCategoryLogLevel(error.category);
    
    // Estruturar o log
    const logEntry = {
      level,
      timestamp: new Date(),
      message: `[Auth Error] ${error.message}`,
      data: {
        errorCode: error.code,
        errorCategory: error.category,
        userId: userId || 'unknown',
        recoverable: error.recoverable,
        suggestedAction: error.suggestedAction,
        // Não incluir o erro original completo para evitar dados sensíveis
        originalErrorMessage: error.originalError?.message
      }
    };
    
    // Adicionar ao histórico local
    this.addToLogs(logEntry);
    
    // Log no console para desenvolvimento
    this.logToConsole(logEntry);
    
    // Enviar para serviço de monitoramento (em produção)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry);
    }
  }
  
  /**
   * Registrar tentativa de login
   */
  public logLoginAttempt(email: string, success: boolean, method: string): void {
    const logEntry = {
      level: success ? LogLevel.INFO : LogLevel.WARN,
      timestamp: new Date(),
      message: `[Auth] Login ${success ? 'successful' : 'failed'} via ${method}`,
      data: {
        email: this.maskEmail(email),
        method,
        success
      }
    };
    
    this.addToLogs(logEntry);
    this.logToConsole(logEntry);
    
    // Em produção, monitorar tentativas de login, especialmente falhas
    if (process.env.NODE_ENV === 'production' && !success) {
      this.sendToMonitoringService(logEntry);
    }
  }
  
  /**
   * Registrar ações de autenticação gerais
   */
  public logAuthAction(action: string, userId?: string, data?: any): void {
    const logEntry = {
      level: LogLevel.INFO,
      timestamp: new Date(),
      message: `[Auth] ${action}`,
      data: {
        userId: userId || 'unknown',
        ...data
      }
    };
    
    this.addToLogs(logEntry);
    this.logToConsole(logEntry);
  }
  
  /**
   * Obter todos os logs armazenados
   */
  public getLogs(): Array<any> {
    return [...this.logs];
  }
  
  /**
   * Limpar logs armazenados
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Adicionar entrada ao histórico local, mantendo tamanho máximo
   */
  private addToLogs(logEntry: any): void {
    this.logs.push(logEntry);
    
    // Manter o tamanho máximo
    if (this.logs.length > this.MAX_LOG_SIZE) {
      this.logs.shift();
    }
  }
  
  /**
   * Log no console com formatação e cores apropriadas
   */
  private logToConsole(logEntry: any): void {
    const timestamp = logEntry.timestamp.toISOString();
    const message = `${timestamp} ${logEntry.message}`;
    
    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logEntry.data);
        break;
      case LogLevel.INFO:
        console.info(message, logEntry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, logEntry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, logEntry.data);
        break;
      default:
        console.log(message, logEntry.data);
    }
  }
  
  /**
   * Enviar para serviço de monitoramento externo
   * Pode ser implementado com serviços como Sentry, LogRocket, etc.
   */
  private sendToMonitoringService(logEntry: any): void {
    // Implementação de exemplo, deve ser substituída por um serviço real
    // Como Sentry, LogRocket, ou outro serviço de monitoramento
    if (typeof window !== 'undefined' && (window as any).sentryCapture) {
      (window as any).sentryCapture({
        level: logEntry.level,
        message: logEntry.message,
        extra: logEntry.data
      });
    }
  }
  
  /**
   * Determinar o nível de log com base na categoria do erro
   */
  private getCategoryLogLevel(category: AuthErrorCategory): LogLevel {
    switch (category) {
      case AuthErrorCategory.INVALID_CREDENTIALS:
      case AuthErrorCategory.USER_NOT_FOUND:
      case AuthErrorCategory.SESSION_EXPIRED:
      case AuthErrorCategory.TOKEN_EXPIRED:
        return LogLevel.INFO;
        
      case AuthErrorCategory.RATE_LIMITED:
      case AuthErrorCategory.OAUTH_ERROR:
      case AuthErrorCategory.COOKIE_ERROR:
        return LogLevel.WARN;
        
      case AuthErrorCategory.NETWORK_ERROR:
      case AuthErrorCategory.SERVER_ERROR:
        return LogLevel.ERROR;
        
      case AuthErrorCategory.SECURITY_ERROR:
        return LogLevel.CRITICAL;
        
      default:
        return LogLevel.ERROR;
    }
  }
  
  /**
   * Mascarar email para privacidade em logs
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'invalid-email';
    
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }
}

// Exportar uma instância singleton
export const authLogger = AuthLogger.getInstance(); 