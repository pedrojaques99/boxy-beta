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

/**
 * A centralized service for all authentication-related operations
 * This consolidates the repeated auth logic scattered across various components
 */
export class AuthService {
  private supabase = createClient();

  /**
   * Get the current authenticated session
   * @returns The Supabase session data
   */
  getSession = async () => {
    return await this.supabase.auth.getSession();
  };

  /**
   * Get the current authenticated user
   * @returns The Supabase user data
   */
  getUser = async () => {
    return await this.supabase.auth.getUser();
  };

  /**
   * Check if user is authenticated
   * @returns Boolean indicating if user is authenticated
   */
  isAuthenticated = async () => {
    try {
      const { data, error } = await this.getSession();
      return !error && !!data.session;
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
      return await this.supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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
    if (!userId) return null;
    
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
      throw error;
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
  checkAndRepairAuthCookies = () => {
    if (typeof document === 'undefined') return { fixed: false, message: 'Not in browser environment' };
    
    try {
      const cookies = document.cookie.split(';');
      let foundCorruptedCookies = false;
      
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=').map(part => part.trim());
        
        // Check for corrupted auth cookies
        if ((name.includes('supabase') || name.includes('sb-')) && 
            (!value || value === 'undefined' || value === 'null')) {
          // Clear corrupted cookie
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          foundCorruptedCookies = true;
        }
      });
      
      return { 
        fixed: foundCorruptedCookies,
        message: foundCorruptedCookies ? 'Corrupted cookies cleared' : 'No corrupted cookies found' 
      };
    } catch (err) {
      console.error('Error checking cookies:', err);
      return { fixed: false, message: 'Error checking cookies' };
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
  getCachedAdminStatus = (userId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    const cachedAdminStatus = sessionStorage.getItem('admin_authenticated');
    const cachedUserId = sessionStorage.getItem('admin_user_id');
    
    return cachedAdminStatus === 'true' && cachedUserId === userId;
  };

  /**
   * Save admin status to session storage
   * @param userId User ID to cache
   * @param isAdmin Whether user has admin status
   */
  saveCachedAdminStatus = (userId: string, isAdmin: boolean): void => {
    if (typeof window === 'undefined') return;
    
    if (isAdmin) {
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_user_id', userId);
    } else {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_user_id');
    }
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
      return await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (error) {
      console.error('Error signing in with password:', error);
      throw error;
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
      return await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw error;
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
}

// Export a function to get the AuthService singleton
export function getAuthService() {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

export default AuthService; 