import { Router } from 'next/router';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { 
  AuthError, 
  AuthErrorCategory, 
  createAuthError, 
  mapSupabaseErrorToCategory 
} from './auth-errors';
import { authLogger } from '../logging/auth-logger';

// Singleton instance
let authServiceInstance: AuthService | null = null;

type UserProfile = {
  id: string;
  role?: string;
  [key: string]: any;
};

type AdminCheckResult = {
  isAdmin: boolean;
  profile: UserProfile | null;
  error: string | null;
};

type OAuthProvider = 'github' | 'google';

/**
 * A centralized service for all authentication-related operations
 * This consolidates the repeated auth logic scattered across various components
 */
export class AuthService {
  private supabase = createClient();
  private adminCache: Map<string, { isAdmin: boolean; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private loginAttempts: Map<string, { count: number; timestamp: number }> = new Map();

  /**
   * Get the current authenticated session
   * @returns The Supabase session data
   */
  getSession = async () => {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
        throw error;
      }

      // Check if session is about to expire
      if (data.session) {
        const expiresAt = new Date(data.session.expires_at! * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // If session expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          try {
            const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Session refresh error:', refreshError);
              throw refreshError;
            }
            return { data: refreshData, error: null };
          } catch (refreshError) {
            console.error('Failed to refresh session:', refreshError);
            // If refresh fails, try to repair cookies
            await this.checkAndRepairAuthCookies();
            throw refreshError;
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      // Try to repair cookies if session error
      if (error instanceof Error && 
          (error.message.includes('parse cookie') || 
           error.message.includes('JSON') || 
           error.message.includes('token'))) {
        await this.checkAndRepairAuthCookies();
      }
      
      const authError = this.handleError(error, 'Failed to get session');
      const userId = await this.getCurrentUserId();
      
      // Log o erro
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };

  /**
   * Get the current authenticated user
   * @returns The Supabase user data
   */
  getUser = async () => {
    try {
      return await this.supabase.auth.getUser();
    } catch (error) {
      console.error('Error getting user:', error);
      
      const authError = this.handleError(error, 'Failed to get user');
      authLogger.logAuthError(authError);
      
      throw authError;
    }
  };

  /**
   * Get current user ID if available
   * @returns User ID or undefined
   */
  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data } = await this.supabase.auth.getUser();
      return data.user?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated = async () => {
    try {
      const { data, error } = await this.getSession();
      if (error) throw error;
      return !!data.session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  };

  /**
   * Sign out the current user
   * @returns The result of the sign out operation
   */
  signOut = async () => {
    try {
      const userId = await this.getCurrentUserId();
      this.clearCachedAdminStatus();
      
      const result = await this.supabase.auth.signOut();
      
      // Log a ação de logout bem-sucedida
      if (!result.error) {
        authLogger.logAuthAction('User signed out', userId);
      }
      
      return result;
    } catch (error) {
      console.error('Error signing out:', error);
      const authError = this.handleError(error, 'Failed to sign out');
      const userId = await this.getCurrentUserId();
      
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };

  /**
   * Redirect to login page with a standard format for the redirect URL
   * @param router Next.js router
   * @param redirectTo Optional URL to redirect after login
   * @param reason Optional reason for the redirect
   */
  redirectToAuthPage = (router: AppRouterInstance | Router, redirectTo = '', reason = '') => {
    const searchParams = new URLSearchParams();
    
    if (redirectTo) {
      searchParams.set('redirectTo', encodeURIComponent(redirectTo));
    }
    
    if (reason) {
      searchParams.set('reason', encodeURIComponent(reason));
    }
    
    const queryString = searchParams.toString();
    const redirectPath = `/auth/login${queryString ? `?${queryString}` : ''}`;
    
    console.log('Redirecting to auth page:', redirectPath);
    router.push(redirectPath);
    
    // Log a redireção para fins de diagnóstico
    authLogger.logAuthAction('Redirected to auth page', undefined, { redirectPath, reason });
  };

  /**
   * Backward compatibility for redirectToLogin, uses redirectToAuthPage
   */
  redirectToLogin = (router: AppRouterInstance | Router, redirectTo = '') => {
    return this.redirectToAuthPage(router, redirectTo);
  };

  /**
   * Get user profile from the database
   * @param userId User ID to fetch profile for
   * @returns User profile data
   */
  getUserProfile = async (userId: string) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      const authError = this.handleError(
        error, 
        'Failed to fetch user profile',
        AuthErrorCategory.UNEXPECTED_ERROR
      );
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };
  
  /**
   * Create or update a user profile
   * @param profile Profile data to save
   * @returns The saved profile data
   */
  saveUserProfile = async (profile: UserProfile) => {
    if (!profile.id) throw new Error('User ID is required');
    
    try {
      // Check if profile exists
      const { data: existingProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.id)
        .single();
        
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await this.supabase
          .from('profiles')
          .update(profile)
          .eq('id', profile.id)
          .select()
          .single();
          
        if (error) throw error;
        
        // Log atualização bem-sucedida
        authLogger.logAuthAction('Profile updated', profile.id);
        
        return data;
      } else {
        // Insert new profile
        const { data, error } = await this.supabase
          .from('profiles')
          .insert([profile])
          .select()
          .single();
          
        if (error) throw error;
        
        // Log criação bem-sucedida
        authLogger.logAuthAction('Profile created', profile.id);
        
        return data;
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      
      const authError = this.handleError(
        error, 
        'Failed to save user profile',
        AuthErrorCategory.UNEXPECTED_ERROR
      );
      authLogger.logAuthError(authError, profile.id);
      
      throw authError;
    }
  };
  
  /**
   * Check if a user has an active subscription
   * @param userId User ID to check subscription for
   * @returns Subscription data if exists
   */
  getUserSubscription = async (userId: string) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Just return null for subscription errors
      return null;
    }
  };
  
  /**
   * Check for and repair auth-related cookies
   * This is used as a fallback for handling cookie issues
   */
  checkAndRepairAuthCookies = async () => {
    if (typeof document === 'undefined') return;
    
    try {
      console.log('Running auth cookie repair process');
      
      // Clear all potential problematic cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'oauth_state',
        'oauth_state_timestamp',
        'auth_debug',
        'auth_timestamp',
        'auth_error'
      ];
      
      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // Also try with domain
        const domain = window.location.hostname.includes('.')
          ? window.location.hostname.split('.').slice(-2).join('.')
          : window.location.hostname;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      });
      
      // Create a debug cookie to indicate repair was attempted
      document.cookie = `auth_repair_attempted=${Date.now()}; path=/; max-age=300; SameSite=Lax`;
      
      // Force refresh the auth state
      const { error } = await this.supabase.auth.refreshSession();
      if (error) {
        console.log('Session refresh failed during repair:', error);
        
        // If refresh failed, try to sign out to clean state
        await this.supabase.auth.signOut({ scope: 'local' });
      }
      
      // Log a tentativa de reparo
      const userId = await this.getCurrentUserId();
      authLogger.logAuthAction('Auth cookies repair attempted', userId, { success: !error });
      
      return { success: true };
    } catch (error) {
      console.error('Error during auth cookie repair:', error);
      
      const authError = this.handleError(
        error, 
        'Failed to repair auth cookies',
        AuthErrorCategory.COOKIE_ERROR
      );
      const userId = await this.getCurrentUserId();
      authLogger.logAuthError(authError, userId);
      
      return { success: false, error: authError };
    }
  };

  /**
   * Check if the user has admin role
   * @param userId The user ID to check
   * @returns Object with admin status, profile data, and potential error
   */
  checkAdminStatus = async (userId: string): Promise<AdminCheckResult> => {
    if (!userId) {
      return { isAdmin: false, profile: null, error: 'No user ID provided' };
    }
    try {
      console.log('AuthService - Verificando status de admin para usuário:', userId);
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) {
        console.error('AuthService - Erro ao buscar perfil:', profileError, 'userId:', userId);
        const authError = this.handleError(
          profileError,
          `Erro ao buscar perfil: ${profileError.message}`,
          AuthErrorCategory.UNEXPECTED_ERROR
        );
        authLogger.logAuthError(authError, userId);
        return {
          isAdmin: false,
          profile: null,
          error: authError.message
        };
      }
      if (!profile) {
        console.warn('AuthService - Nenhum perfil encontrado para userId:', userId);
        return {
          isAdmin: false,
          profile: null,
          error: 'Perfil não encontrado'
        };
      }
      console.log('AuthService - Perfil obtido:', profile);
      const isAdmin = profile?.role === 'admin';
      authLogger.logAuthAction('Admin status checked', userId, { isAdmin });
      return {
        isAdmin,
        profile,
        error: null
      };
    } catch (error) {
      console.error('AuthService - Erro ao verificar status admin:', error);
      const authError = this.handleError(
        error,
        'Erro ao verificar status admin',
        AuthErrorCategory.UNEXPECTED_ERROR
      );
      authLogger.logAuthError(authError, userId);
      return {
        isAdmin: false,
        profile: null,
        error: authError.message
      };
    }
  };

  /**
   * Get admin status from session storage (for caching purposes)
   * @param userId Current user ID to validate against cached value
   * @returns True if user is admin according to session storage
   */
  getCachedAdminStatus = (userId: string): boolean | null => {
    const cached = this.adminCache.get(userId);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.adminCache.delete(userId);
      return null;
    }

    return cached.isAdmin;
  };

  /**
   * Save admin status to session storage
   * @param userId User ID to cache
   * @param isAdmin Whether user has admin status
   */
  saveCachedAdminStatus = (userId: string, isAdmin: boolean): void => {
    this.adminCache.set(userId, { isAdmin, timestamp: Date.now() });
  };

  /**
   * Clear admin status from session storage
   */
  clearCachedAdminStatus = (): void => {
    if (typeof window === 'undefined') return;
    
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_user_id');
  };

  /**
   * Verify admin password
   * @param password Password to verify
   * @returns Whether password is correct
   */
  verifyAdminPassword = (password: string): boolean => {
    const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'boxy123';
    return password === SECRET;
  };

  /**
   * Sign in with password
   * @param email User email
   * @param password User password
   * @returns The result of the sign in operation
   */
  signInWithPassword = async (email: string, password: string) => {
    try {
      if (this.isRateLimited(email)) {
        const rateLimitError = createAuthError(
          'Too many login attempts. Please try again later.',
          AuthErrorCategory.RATE_LIMITED
        );
        
        // Log tentativa bloqueada por rate limit
        authLogger.logLoginAttempt(email, false, 'password_rate_limited');
        
        throw rateLimitError;
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.recordLoginAttempt(email);
        
        // Log falha de login
        authLogger.logLoginAttempt(email, false, 'password');
        
        throw error;
      }

      // Login bem-sucedido
      this.clearLoginAttempts(email);
      authLogger.logLoginAttempt(email, true, 'password');
      
      if (data.user) {
        authLogger.logAuthAction('User signed in', data.user.id, { method: 'password' });
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      
      const category = error instanceof Error && 
        error.message.includes('rate limit') ? 
        AuthErrorCategory.RATE_LIMITED : 
        AuthErrorCategory.INVALID_CREDENTIALS;
        
      const authError = this.handleError(error, 'Failed to sign in', category);
      
      // Não registramos novamente aqui porque já registramos acima no caso de falha
      
      throw authError;
    }
  };
  
  /**
   * Sign in with OAuth provider
   * @param provider OAuth provider (github, google, etc.)
   * @param redirectTo Optional URL to redirect after login
   * @returns The result of the sign in operation
   */
  signInWithOAuth = async (provider: OAuthProvider, redirectTo = `${window.location.origin}/auth/oauth`) => {
    try {
      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
      if (!isBrowser) {
        const browserError = createAuthError(
          'OAuth sign in can only be initiated from the browser',
          AuthErrorCategory.UNEXPECTED_ERROR
        );
        
        authLogger.logAuthError(browserError);
        throw browserError;
      }

      // Generate a new secure random state
      const state = crypto.randomUUID();
      
      // Store state in localStorage (more reliable than cookies for OAuth flow)
      localStorage.setItem('supabase_oauth_state', state);
      localStorage.setItem('supabase_oauth_state_timestamp', Date.now().toString());
      
      // Ensure we have a valid redirectTo URL
      const finalRedirectTo = redirectTo || `${window.location.origin}/auth/oauth`;
      
      console.log('OAuth flow initiated with state:', state);
      console.log('Redirect URL:', finalRedirectTo);
      
      // Log início do fluxo OAuth
      authLogger.logAuthAction('OAuth flow initiated', undefined, { 
        provider, 
        redirectTo: finalRedirectTo,
        state: state.substring(0, 8) + '...' // Apenas parte do state por segurança
      });

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: finalRedirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
          flowType: 'pkce',
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('OAuth sign in error:', error);
        // Clear state on error
        localStorage.removeItem('supabase_oauth_state');
        localStorage.removeItem('supabase_oauth_state_timestamp');
        
        // Log falha no início do OAuth
        authLogger.logLoginAttempt('oauth_user', false, `oauth_${provider}`);
        
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with OAuth:', error);
      
      // Try to repair cookies if OAuth error
      if (error instanceof Error && 
          (error.message.includes('parse cookie') || 
           error.message.includes('JSON') || 
           error.message.includes('token'))) {
        await this.checkAndRepairAuthCookies();
      }
      
      const authError = this.handleError(error, 'Failed to sign in with OAuth', AuthErrorCategory.OAUTH_ERROR);
      authLogger.logAuthError(authError);
      
      throw authError;
    }
  };
  
  /**
   * Sign up with email and password
   * @param email User email
   * @param password User password
   * @param redirectTo Optional URL to redirect after sign up
   * @returns The result of the sign up operation
   */
  signUp = async (email: string, password: string, redirectTo = `${window.location.origin}/auth/callback`) => {
    try {
      const result = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          redirectTo,
        },
      });
      
      if (result.error) {
        // Log falha no signup
        authLogger.logAuthAction('Sign up failed', undefined, { 
          email: email.split('@')[1], // Apenas o domínio por segurança
          error: result.error.message
        });
        
        throw result.error;
      }
      
      // Log signup bem-sucedido
      authLogger.logAuthAction('User signed up', result.data?.user?.id, { 
        email: email.split('@')[1] // Apenas o domínio por segurança
      });
      
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      
      const authError = this.handleError(error, 'Failed to sign up');
      authLogger.logAuthError(authError);
      
      throw authError;
    }
  };
  
  /**
   * Reset password for email
   * @param email Email to send reset password link
   * @param redirectTo URL to redirect after password reset
   * @returns The result of the reset password operation
   */
  resetPasswordForEmail = async (email: string, redirectTo = `${window.location.origin}/auth/update-password`) => {
    try {
      const result = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (result.error) {
        // Log falha no reset de senha
        authLogger.logAuthAction('Password reset failed', undefined, { 
          error: result.error.message 
        });
        
        throw result.error;
      }
      
      // Log reset de senha iniciado
      authLogger.logAuthAction('Password reset initiated', undefined, { 
        email: email.split('@')[1] // Apenas o domínio por segurança
      });
      
      return result;
    } catch (error) {
      console.error('Error resetting password:', error);
      
      const authError = this.handleError(error, 'Failed to reset password');
      authLogger.logAuthError(authError);
      
      throw authError;
    }
  };
  
  /**
   * Update user data
   * @param userData User data to update
   * @returns The result of the update operation
   */
  updateUser = async (userData: { password?: string; email?: string; data?: object }) => {
    try {
      const userId = await this.getCurrentUserId();
      const result = await this.supabase.auth.updateUser(userData);
      
      if (result.error) {
        // Log falha na atualização
        authLogger.logAuthAction('User update failed', userId, { 
          error: result.error.message,
          fields: Object.keys(userData)
        });
        
        throw result.error;
      }
      
      // Log atualização bem-sucedida
      authLogger.logAuthAction('User updated', userId, { 
        fields: Object.keys(userData)
      });
      
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      
      const userId = await this.getCurrentUserId();
      const authError = this.handleError(error, 'Failed to update user');
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };

  /**
   * Upload a file to Supabase storage
   * @param bucket The storage bucket name
   * @param path The path where the file should be stored
   * @param file The file to upload
   * @param options Optional upload options
   * @returns The public URL of the uploaded file
   */
  uploadFile = async (
    bucket: string,
    path: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ) => {
    try {
      const { error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);
        
      // Log upload bem-sucedido
      const userId = await this.getCurrentUserId();
      authLogger.logAuthAction('File uploaded', userId, { 
        bucket,
        path,
        fileSize: file.size,
        fileType: file.type
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      const userId = await this.getCurrentUserId();
      const authError = this.handleError(error, 'Failed to upload file');
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };

  /**
   * Remove a file from Supabase storage
   * @param bucket The storage bucket name
   * @param path The path of the file to remove
   */
  removeFile = async (bucket: string, path: string) => {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      
      // Log remoção bem-sucedida
      const userId = await this.getCurrentUserId();
      authLogger.logAuthAction('File removed', userId, { bucket, path });
      
    } catch (error) {
      console.error('Error removing file:', error);
      
      const userId = await this.getCurrentUserId();
      const authError = this.handleError(error, 'Failed to remove file');
      authLogger.logAuthError(authError, userId);
      
      throw authError;
    }
  };

  /**
   * Get the public URL for a file in storage
   * @param bucket The storage bucket name
   * @param path The path of the file
   * @returns The public URL of the file
   */
  getPublicUrl = (bucket: string, path: string) => {
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  };

  /**
   * Get recent downloads for a user
   * @param userId User ID to fetch downloads for
   * @param limit Number of downloads to fetch
   * @returns Array of recent downloads
   */
  getRecentDownloads = async (userId: string, limit = 5) => {
    try {
      const { data, error } = await this.supabase
        .from('downloads')
        .select(`
          id,
          created_at,
          resource:resource_id (
            id,
            title,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recent downloads:', error);
      
      const authError = this.handleError(error, 'Failed to fetch recent downloads');
      authLogger.logAuthError(authError, userId);
      
      return [];
    }
  };

  /**
   * Get liked resources (from resources table) for a user
   * @param userId User ID to fetch likes for
   * @returns Array of liked resources
   */
  getUserLikedResources = async (userId: string) => {
    if (!userId) return [];
    try {
      const { data, error } = await this.supabase
        .from('likes')
        .select(`
          id,
          created_at,
          resource:resource_id (
            id,
            title,
            description,
            thumbnail_url
          )
        `)
        .eq('user_id', userId)
        .not('resource_id', 'is', null);
      if (error) throw error;
      // Only return resources that exist (resource may be null if deleted)
      return (data ?? []).map((like: any) => like.resource).filter(Boolean);
    } catch (error) {
      console.error('Error fetching liked resources:', error);
      return [];
    }
  };

  /**
   * Get liked products (from products table) for a user
   * @param userId User ID to fetch likes for
   * @returns Array of liked products
   */
  getUserLikedProducts = async (userId: string) => {
    if (!userId) return [];
    try {
      const { data, error } = await this.supabase
        .from('likes')
        .select(`
          id,
          created_at,
          product:product_id (
            id,
            name,
            description,
            thumb
          )
        `)
        .eq('user_id', userId)
        .not('product_id', 'is', null);
      if (error) throw error;
      // Only return products that exist (product may be null if deleted)
      return (data ?? []).map((like: any) => like.product).filter(Boolean);
    } catch (error) {
      console.error('Error fetching liked products:', error);
      return [];
    }
  };

  /**
   * Handle errors consistently across the service
   * @param error The error to handle
   * @param defaultMessage Default error message if none provided
   * @param category Optional error category override
   * @returns Formatted and detailed auth error object
   */
  private handleError(
    error: unknown, 
    defaultMessage: string,
    category?: AuthErrorCategory
  ): AuthError {
    let errorMessage = defaultMessage;
    let errorCode: string | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message || defaultMessage;
      errorCode = (error as any).code;
    }
    
    // Determinar a categoria com base no código/mensagem se não fornecida
    const errorCategory = category || mapSupabaseErrorToCategory(errorCode, errorMessage);
    
    // Criar objeto de erro detalhado
    return createAuthError(
      errorMessage,
      errorCategory,
      error,
      errorCode
    );
  }

  private isRateLimited(email: string): boolean {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return false;

    const now = Date.now();
    if (now - attempt.timestamp > this.LOGIN_ATTEMPT_WINDOW) {
      this.loginAttempts.delete(email);
      return false;
    }

    return attempt.count >= this.MAX_LOGIN_ATTEMPTS;
  }

  private recordLoginAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
    attempt.count++;
    this.loginAttempts.set(email, attempt);
  }

  private clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }
}

/**
 * Get the singleton instance of AuthService
 * @returns The AuthService instance
 */
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

export default AuthService; 