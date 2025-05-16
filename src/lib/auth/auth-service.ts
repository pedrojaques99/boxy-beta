import { Router } from 'next/router';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

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

type AuthError = {
  message: string;
  code?: string;
};

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
      throw this.handleError(error, 'Failed to get session');
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
      throw this.handleError(error, 'Failed to get user');
    }
  };

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
      this.clearCachedAdminStatus();
      return await this.supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw this.handleError(error, 'Failed to sign out');
    }
  };

  /**
   * Redirect to login page with an optional redirect URL
   * @param router Next.js router
   * @param redirectTo Optional URL to redirect after login
   */
  redirectToLogin = (router: AppRouterInstance | Router, redirectTo = '') => {
    const redirectParam = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
    router.push(`/auth/login${redirectParam}`);
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
      throw this.handleError(error, 'Failed to fetch user profile');
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
        return data;
      } else {
        // Insert new profile
        const { data, error } = await this.supabase
          .from('profiles')
          .insert([profile])
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
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
   * Check and repair auth cookies if needed
   * @returns Object with status of repair operation
   */
  checkAndRepairAuthCookies = async () => {
    if (typeof document === 'undefined') return { fixed: false, message: 'Not in browser environment' };
    
    try {
      const cookies = document.cookie.split(';');
      let foundCorruptedCookies = false;
      let secureCookies = false;
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=').map(part => part.trim());
        
        // Check for corrupted auth cookies
        if ((name.includes('supabase') || name.includes('sb-')) && 
            (!value || value === 'undefined' || value === 'null')) {
          // Clear corrupted cookie with secure flags
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
          foundCorruptedCookies = true;
        }

        // Check if we have secure cookies
        if (name.includes('supabase') || name.includes('sb-')) {
          secureCookies = true;
        }
      });

      // If no secure cookies found or found corrupted ones, try to refresh session
      if (!secureCookies || foundCorruptedCookies) {
        try {
          const { data: session } = await this.getSession();
          if (session?.session) {
            // Force a session refresh to get secure cookies
            await this.supabase.auth.refreshSession();
            return { fixed: true, message: 'Cookies repaired and session refreshed' };
          }
        } catch (error) {
          console.error('Failed to refresh session during cookie repair:', error);
        }
      }
      
      return { 
        fixed: foundCorruptedCookies,
        message: foundCorruptedCookies ? 'Corrupted cookies cleared' : 'No corrupted cookies found',
        secureCookies
      };
    } catch (err) {
      console.error('Error checking cookies:', err);
      return { fixed: false, message: 'Error checking cookies', secureCookies: false };
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
        .single();
        
      if (profileError) {
        console.error('AuthService - Erro ao buscar perfil:', profileError);
        return { 
          isAdmin: false, 
          profile: null, 
          error: `Erro ao buscar perfil: ${profileError.message}` 
        };
      }
      
      console.log('AuthService - Perfil obtido:', profile);
      const isAdmin = profile?.role === 'admin';
      
      return { 
        isAdmin, 
        profile, 
        error: null 
      };
    } catch (error) {
      console.error('AuthService - Erro ao verificar status admin:', error);
      const errorMessage = `Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      
      return { 
        isAdmin: false, 
        profile: null, 
        error: errorMessage 
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
        throw new Error('Too many login attempts. Please try again later.');
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.recordLoginAttempt(email);
        throw error;
      }

      this.clearLoginAttempts(email);
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      throw this.handleError(error, 'Failed to sign in');
    }
  };
  
  /**
   * Sign in with OAuth provider
   * @param provider OAuth provider (github, google, etc.)
   * @param redirectTo Optional URL to redirect after login
   * @returns The result of the sign in operation
   */
  signInWithOAuth = async (provider: OAuthProvider, redirectTo = `${window.location.origin}/auth/callback`) => {
    try {
      // Generate a new secure random state
      const state = crypto.randomUUID();
      
      // Store state in cookies with more secure settings
      if (typeof document !== 'undefined') {
        // Clear any existing state first
        document.cookie = 'oauth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'oauth_state_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Set new state cookies with enhanced security
        const cookieOptions = {
          path: '/',
          maxAge: 600, // 10 minutes
          sameSite: 'lax' as const,
          secure: true,
          httpOnly: false // Must be false to be accessible by JavaScript
        };
        
        document.cookie = `oauth_state=${state}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`;
          
        document.cookie = `oauth_state_timestamp=${Date.now()}; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`;
          
        // Add debug cookie
        document.cookie = `auth_debug=oauth_initiated; ${Object.entries(cookieOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')}`;
      }

      // Ensure we have a valid redirectTo URL
      const finalRedirectTo = redirectTo || `${window.location.origin}/auth/callback`;

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: finalRedirectTo,
          queryParams: {
            state,
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
        // Clear state cookies on error
        if (typeof document !== 'undefined') {
          document.cookie = 'oauth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'oauth_state_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
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
      throw this.handleError(error, 'Failed to sign in with OAuth');
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
      return await this.supabase.auth.signUp({
        email,
        password,
        options: {
          redirectTo,
        },
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
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
      return await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };
  
  /**
   * Update user data
   * @param userData User data to update
   * @returns The result of the update operation
   */
  updateUser = async (userData: { password?: string; email?: string; data?: object }) => {
    try {
      return await this.supabase.auth.updateUser(userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
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

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
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
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
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
      return [];
    }
  };

  /**
   * Handle errors consistently across the service
   * @param error The error to handle
   * @param defaultMessage Default error message if none provided
   * @returns Formatted error object
   */
  private handleError(error: unknown, defaultMessage: string): AuthError {
    if (error instanceof Error) {
      return {
        message: error.message || defaultMessage,
        code: (error as any).code
      };
    }
    return {
      message: defaultMessage
    };
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