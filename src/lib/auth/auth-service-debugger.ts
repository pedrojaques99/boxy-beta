'use client'

import { getAuthService } from '@/lib/auth/auth-service'
import { AuthError } from '@supabase/supabase-js'

// List of known OAuth providers supported by Supabase
export type OAuthProvider = 'google' | 'github'

interface OAuthDebugInfo {
  state: string | null
  provider: string
  redirectUrl: string
  timestamp: number
  success?: boolean
  error?: string
  errorDescription?: string
}

interface ErrorAnalysis {
  errorType: string
  possibleCauses: string[]
  recommendations: string[]
}

/**
 * AuthServiceDebugger extends the AuthService with debugging tools
 * specifically for diagnosing and fixing OAuth issues
 */
export class AuthServiceDebugger {
  private authService = getAuthService()
  private readonly DEBUG_HISTORY_KEY = 'oauth_debug_history'
  private readonly DEBUG_STATE_KEY = 'oauth_debug_state'
  
  /**
   * Start an OAuth flow with debug parameters
   */
  public async startOAuthFlow(provider: OAuthProvider, redirectUrl: string): Promise<void> {
    try {
      // Create a unique state value for tracking this specific flow
      const debugState = `debug_${Math.random().toString(36).substring(2, 15)}`
      
      // Store debug info in localStorage
      this.saveDebugInfo({
        state: debugState,
        provider,
        redirectUrl,
        timestamp: Date.now(),
      })
      
      // Store the debug state for later verification
      localStorage.setItem(this.DEBUG_STATE_KEY, debugState)
      
      // Log the start of the debug flow
      console.log(`[AUTH-DEBUG] Starting OAuth flow for ${provider} with debug state ${debugState}`)
      
      // Use the auth service to initiate the OAuth flow
      await this.authService.signInWithOAuth(provider, redirectUrl)
    } catch (error) {
      // Log and store any errors
      console.error('[AUTH-DEBUG] Error starting OAuth flow:', error)
      this.updateLastDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        success: false
      })
    }
  }
  
  /**
   * Check and process the OAuth callback
   */
  public processCallback(url: string): { success: boolean; message: string } {
    try {
      const urlObj = new URL(url)
      const error = urlObj.searchParams.get('error')
      const errorDescription = urlObj.searchParams.get('error_description')
      
      // Check if we have an error in the URL
      if (error) {
        this.updateLastDebugInfo({
          error,
          errorDescription: errorDescription || undefined,
          success: false
        })
        
        return {
          success: false,
          message: `Error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`
        }
      }
      
      // Check if state parameter matches our stored debug state
      const state = urlObj.searchParams.get('state')
      const storedState = localStorage.getItem(this.DEBUG_STATE_KEY)
      
      if (!state || !storedState) {
        this.updateLastDebugInfo({
          error: 'Missing state parameter',
          success: false
        })
        
        return {
          success: false,
          message: 'OAuth state parameter is missing from the callback URL or localStorage'
        }
      }
      
      if (state !== storedState) {
        this.updateLastDebugInfo({
          error: 'State mismatch',
          success: false
        })
        
        return {
          success: false,
          message: `OAuth state mismatch: received "${state}" but expected "${storedState}"`
        }
      }
      
      // If we got here, the callback looks valid
      this.updateLastDebugInfo({
        success: true
      })
      
      return {
        success: true,
        message: 'OAuth callback processed successfully'
      }
    } catch (error) {
      console.error('[AUTH-DEBUG] Error processing callback:', error)
      
      this.updateLastDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        success: false
      })
      
      return {
        success: false,
        message: `Error processing callback: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
  
  /**
   * Get detailed information about the authentication errors
   */
  public async analyzeAuthError(error: AuthError | Error | any): Promise<ErrorAnalysis> {
    let errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as any).message)
        : String(error)
    
    // Check for common error patterns
    const errorDetails: ErrorAnalysis = {
      errorType: 'Unknown',
      possibleCauses: [] as string[],
      recommendations: [] as string[]
    }
    
    if (errorMessage.includes('invalid state')) {
      errorDetails.errorType = 'OAuth State Mismatch'
      errorDetails.possibleCauses = [
        'Browser localStorage may have been cleared during the OAuth flow',
        'Cross-domain redirect issues',
        'Ad blockers or privacy extensions interfering with storage',
        'Using Incognito/Private mode which limits localStorage'
      ]
      errorDetails.recommendations = [
        'Try using a regular browser window (not incognito/private)',
        'Temporarily disable ad blockers and privacy extensions',
        'Consider switching from localStorage to cookies for state management',
        'Add debug logs to track where state is lost'
      ]
    } else if (errorMessage.includes('document is not defined')) {
      errorDetails.errorType = 'Server-Side Rendering Error'
      errorDetails.possibleCauses = [
        'Browser APIs being used during server-side rendering',
        'Missing "use client" directive in components using browser APIs',
        'Accessing localStorage or window outside of useEffect'
      ]
      errorDetails.recommendations = [
        'Add "use client" directive to components using browser APIs',
        'Wrap browser API calls in typeof window !== "undefined" checks',
        'Move browser-specific code to useEffect hooks'
      ]
    } else if (errorMessage.includes('invalid cookie') || errorMessage.includes('parse cookie')) {
      errorDetails.errorType = 'Cookie Parsing Error'
      errorDetails.possibleCauses = [
        'Malformed cookies',
        'Cookie size limits exceeded',
        'Cross-site cookie restrictions'
      ]
      errorDetails.recommendations = [
        'Clear all browser cookies for the site',
        'Check if third-party cookies are blocked',
        'Implement cookie size validation'
      ]
    } else if (errorMessage.includes('network')) {
      errorDetails.errorType = 'Network Error'
      errorDetails.possibleCauses = [
        'API endpoint is unreachable',
        'CORS configuration issues',
        'Network interruption during authentication'
      ]
      errorDetails.recommendations = [
        'Check network connectivity',
        'Verify CORS settings in Supabase dashboard',
        'Retry the authentication process'
      ]
    } else if (errorMessage.includes('timeout')) {
      errorDetails.errorType = 'Timeout Error'
      errorDetails.possibleCauses = [
        'Slow network connection',
        'Server taking too long to respond',
        'Large payload size'
      ]
      errorDetails.recommendations = [
        'Check network speed',
        'Increase timeout settings if possible',
        'Try again when network conditions improve'
      ]
    } else {
      errorDetails.errorType = 'General Authentication Error'
      errorDetails.possibleCauses = [
        'Invalid credentials',
        'Account doesn\'t exist',
        'OAuth provider configuration issues',
        'Expired or invalid tokens'
      ]
      errorDetails.recommendations = [
        'Verify OAuth provider settings in Supabase dashboard',
        'Check that redirect URLs are correctly configured',
        'Clear browser cache and cookies',
        'Try a different authentication method'
      ]
    }
    
    return errorDetails
  }
  
  /**
   * Check all browser storage for authentication artifacts
   */
  public async checkAuthStorageHealth(): Promise<{
    localStorage: { healthy: boolean; issues: string[] };
    cookies: { healthy: boolean; issues: string[] };
    sessionStorage: { healthy: boolean; issues: string[] };
  }> {
    const result = {
      localStorage: { healthy: true, issues: [] as string[] },
      cookies: { healthy: true, issues: [] as string[] },
      sessionStorage: { healthy: true, issues: [] as string[] }
    }
    
    try {
      // Check localStorage
      const testKey = 'auth_debug_test'
      const testValue = `test_${Date.now()}`
      
      try {
        localStorage.setItem(testKey, testValue)
        const retrievedValue = localStorage.getItem(testKey)
        localStorage.removeItem(testKey)
        
        if (retrievedValue !== testValue) {
          result.localStorage.healthy = false
          result.localStorage.issues.push('localStorage values cannot be correctly retrieved after setting')
        }
      } catch (e) {
        result.localStorage.healthy = false
        result.localStorage.issues.push(`localStorage access error: ${String(e)}`)
      }
      
      // Check if auth-related localStorage items exist
      const authKeys = ['supabase.auth.token', 'sb-', 'oauth_state']
      let foundAuthItems = false
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && authKeys.some(authKey => key.includes(authKey))) {
          foundAuthItems = true
          break
        }
      }
      
      if (!foundAuthItems) {
        result.localStorage.issues.push('No authentication-related localStorage items found')
      }
      
      // Check cookies
      if (document.cookie === '') {
        result.cookies.healthy = false
        result.cookies.issues.push('No cookies are present')
      } else {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookies = cookies.filter(c => 
          c.includes('supabase') || c.includes('sb-') || c.includes('auth')
        )
        
        if (authCookies.length === 0) {
          result.cookies.issues.push('No authentication-related cookies found')
        }
      }
      
      // Test cookie setting
      try {
        const cookieTestName = 'auth_debug_cookie_test'
        document.cookie = `${cookieTestName}=1; path=/; max-age=120`
        if (!document.cookie.includes(cookieTestName)) {
          result.cookies.healthy = false
          result.cookies.issues.push('Unable to set test cookie - cookies may be blocked')
        } else {
          // Clean up test cookie
          document.cookie = `${cookieTestName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      } catch (e) {
        result.cookies.healthy = false
        result.cookies.issues.push(`Error setting test cookie: ${String(e)}`)
      }
      
      // Check sessionStorage
      try {
        sessionStorage.setItem(testKey, testValue)
        const retrievedValue = sessionStorage.getItem(testKey)
        sessionStorage.removeItem(testKey)
        
        if (retrievedValue !== testValue) {
          result.sessionStorage.healthy = false
          result.sessionStorage.issues.push('sessionStorage values cannot be correctly retrieved after setting')
        }
      } catch (e) {
        result.sessionStorage.healthy = false
        result.sessionStorage.issues.push(`sessionStorage access error: ${String(e)}`)
      }
    } catch (e) {
      console.error('[AUTH-DEBUG] Error checking storage health:', e)
      
      result.localStorage.healthy = false
      result.localStorage.issues.push(`General error checking storage: ${String(e)}`)
      result.cookies.healthy = false
      result.sessionStorage.healthy = false
    }
    
    return result
  }
  
  /**
   * Get the most recent debug info from localStorage
   */
  public getDebugHistory(): OAuthDebugInfo[] {
    try {
      const historyJson = localStorage.getItem(this.DEBUG_HISTORY_KEY)
      return historyJson ? JSON.parse(historyJson) : []
    } catch {
      return []
    }
  }
  
  /**
   * Save current debug info to history
   */
  private saveDebugInfo(info: OAuthDebugInfo): void {
    try {
      const history = this.getDebugHistory()
      history.unshift(info) // Add to beginning
      
      // Keep only the last 10 entries
      const trimmedHistory = history.slice(0, 10)
      
      localStorage.setItem(this.DEBUG_HISTORY_KEY, JSON.stringify(trimmedHistory))
    } catch (e) {
      console.error('[AUTH-DEBUG] Error saving debug info:', e)
    }
  }
  
  /**
   * Update the last debug info entry
   */
  private updateLastDebugInfo(updates: Partial<OAuthDebugInfo>): void {
    try {
      const history = this.getDebugHistory()
      
      if (history.length > 0) {
        const updatedInfo = { ...history[0], ...updates }
        history[0] = updatedInfo
        localStorage.setItem(this.DEBUG_HISTORY_KEY, JSON.stringify(history))
      }
    } catch (e) {
      console.error('[AUTH-DEBUG] Error updating debug info:', e)
    }
  }
}

// Singleton instance
let debuggerInstance: AuthServiceDebugger | null = null

// Get the AuthServiceDebugger instance
export function getAuthServiceDebugger(): AuthServiceDebugger {
  if (!debuggerInstance) {
    debuggerInstance = new AuthServiceDebugger()
  }
  return debuggerInstance
} 