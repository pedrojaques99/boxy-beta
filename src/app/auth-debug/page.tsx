'use client'

import { useState, useEffect, Suspense } from 'react'
import { getAuthService } from '@/lib/auth/auth-service'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { getAuthServiceDebugger, OAuthProvider } from '@/lib/auth/auth-service-debugger'
import { Loader2 } from 'lucide-react'

function AuthDebugContent() {
  const { user, loading } = useAuth()
  const authService = getAuthService()
  const authDebugger = getAuthServiceDebugger()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<any>(null)
  const [sessionError, setSessionError] = useState<any>(null)
  const [storageData, setStorageData] = useState<Record<string, any>>({})
  const [cookies, setCookies] = useState<string[]>([])
  const [oauthState, setOauthState] = useState<string | null>(null)
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([])
  const [oauthProviders] = useState<OAuthProvider[]>(['google', 'github'])
  const [storageHealth, setStorageHealth] = useState<any>(null)
  const [debugHistory, setDebugHistory] = useState<any[]>([])
  const [errorAnalysis, setErrorAnalysis] = useState<{
    errorType: string;
    possibleCauses: string[];
    recommendations: string[];
  } | null>(null)

  // Check for error parameters in URL
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const logDiagnostic = (message: string) => {
    setDiagnosticLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  useEffect(() => {
    // Get session data
    const getSessionData = async () => {
      try {
        logDiagnostic('Fetching session data...')
        const { data, error } = await authService.getSession()
        if (error) {
          setSessionError(error)
          logDiagnostic(`Session error: ${JSON.stringify(error)}`)
          
          // Analyze the error
          const analysis = await authDebugger.analyzeAuthError(error)
          setErrorAnalysis(analysis)
          logDiagnostic(`Error analysis: ${analysis.errorType}`)
        } else {
          setSession(data.session)
          logDiagnostic(`Session retrieved: ${data.session ? 'Valid' : 'Missing'}`)
        }
      } catch (err) {
        logDiagnostic(`Exception getting session: ${err}`)
        setSessionError(err)
        
        // Analyze the error
        const analysis = await authDebugger.analyzeAuthError(err)
        setErrorAnalysis(analysis)
      }
    }

    // Check local storage
    const checkLocalStorage = () => {
      try {
        const storage: Record<string, any> = {}
        
        // Get all auth-related items
        const authItems = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('oauth') || 
            key.includes('sb-')
          )) {
            try {
              const value = localStorage.getItem(key)
              if (value) {
                storage[key] = JSON.parse(value)
                authItems.push(key)
              }
            } catch (e) {
              storage[key] = localStorage.getItem(key)
            }
          }
        }
        
        // Try to find OAuth state specifically
        const state = localStorage.getItem('supabase.auth.token.oauth_state')
        setOauthState(state)
        logDiagnostic(`Found ${authItems.length} auth-related localStorage items`)
        if (state) {
          logDiagnostic(`Found OAuth state in localStorage: ${state}`)
        } else {
          logDiagnostic('No OAuth state found in localStorage')
        }

        setStorageData(storage)
      } catch (err) {
        logDiagnostic(`Exception checking localStorage: ${err}`)
      }
    }

    // Check cookies
    const checkCookies = () => {
      try {
        const allCookies = document.cookie.split(';').map(cookie => cookie.trim())
        const authCookies = allCookies.filter(cookie => 
          cookie.includes('supabase') || 
          cookie.includes('auth') || 
          cookie.includes('sb-')
        )
        setCookies(authCookies)
        logDiagnostic(`Found ${authCookies.length} auth-related cookies`)
      } catch (err) {
        logDiagnostic(`Exception checking cookies: ${err}`)
      }
    }
    
    // Check storage health using the debugger
    const checkStorageHealth = async () => {
      try {
        logDiagnostic('Checking storage health...')
        const health = await authDebugger.checkAuthStorageHealth()
        setStorageHealth(health)
        
        // Log any issues found
        if (!health.localStorage.healthy) {
          logDiagnostic(`LocalStorage issues: ${health.localStorage.issues.join(', ')}`)
        }
        if (!health.cookies.healthy) {
          logDiagnostic(`Cookie issues: ${health.cookies.issues.join(', ')}`)
        }
        if (!health.sessionStorage.healthy) {
          logDiagnostic(`SessionStorage issues: ${health.sessionStorage.issues.join(', ')}`)
        }
      } catch (err) {
        logDiagnostic(`Error checking storage health: ${err}`)
      }
    }
    
    // Get OAuth debug history
    const getOAuthHistory = () => {
      try {
        const history = authDebugger.getDebugHistory()
        setDebugHistory(history)
        logDiagnostic(`Found ${history.length} OAuth debug history entries`)
      } catch (err) {
        logDiagnostic(`Error getting OAuth history: ${err}`)
      }
    }
    
    // Process OAuth callback if present
    const processCallback = () => {
      if (typeof window !== 'undefined' && window.location.search.includes('state=')) {
        try {
          logDiagnostic('Processing OAuth callback...')
          const result = authDebugger.processCallback(window.location.href)
          logDiagnostic(`Callback result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`)
          
          if (result.success) {
            toast.success('OAuth callback processed successfully')
          } else {
            toast.error(`OAuth callback error: ${result.message}`)
          }
        } catch (err) {
          logDiagnostic(`Error processing callback: ${err}`)
        }
      }
    }

    if (typeof window !== 'undefined') {
      getSessionData()
      checkLocalStorage()
      checkCookies()
      checkStorageHealth()
      getOAuthHistory()
      processCallback()
      
      // Check for auth errors in URL
      if (error) {
        logDiagnostic(`Auth error in URL: ${error}, ${errorDescription || 'No description'}`)
      }
    }
  }, [])

  const clearAuthData = () => {
    try {
      // Clear localStorage items
      Object.keys(storageData).forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear cookies (attempt to)
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0]
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })
      
      // Refresh data
      setStorageData({})
      setCookies([])
      setOauthState(null)
      
      logDiagnostic('Cleared all auth data')
      toast.success('Auth data cleared')
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      logDiagnostic(`Error clearing auth data: ${err}`)
      toast.error('Error clearing auth data')
    }
  }

  const testOAuthFlow = async (provider: OAuthProvider) => {
    try {
      logDiagnostic(`Testing OAuth flow with ${provider}...`)
      await authDebugger.startOAuthFlow(provider, window.location.origin + '/auth-debug')
    } catch (err) {
      logDiagnostic(`Error starting OAuth flow: ${err}`)
      toast.error(`Error starting OAuth flow: ${err}`)
    }
  }

  const renderJSON = (data: any) => {
    try {
      return (
        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[400px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )
    } catch (err) {
      return <div className="text-red-500">Error rendering JSON: {String(err)}</div>
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">OAuth Authentication Debugger</CardTitle>
          <CardDescription>
            This page helps diagnose OAuth authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 border border-red-500 bg-red-50 dark:bg-red-950 rounded-md">
              <h3 className="text-red-600 font-semibold mb-2">Authentication Error</h3>
              <p><strong>Error:</strong> {error}</p>
              {errorDescription && <p><strong>Description:</strong> {errorDescription}</p>}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Current Authentication State</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="font-semibold mb-1">Status</div>
                <div>{loading ? "Loading..." : user ? "Authenticated" : "Not authenticated"}</div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-semibold mb-1">User ID</div>
                <div>{user?.id || "None"}</div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-semibold mb-1">Email</div>
                <div>{user?.email || "None"}</div>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-semibold mb-1">Auth Provider</div>
                <div>{user?.app_metadata?.provider || "None"}</div>
              </div>
            </div>
          </div>
          
          {errorAnalysis && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 rounded-md">
              <h3 className="text-amber-700 dark:text-amber-400 font-semibold mb-2">{errorAnalysis.errorType}</h3>
              
              <div className="mb-3">
                <h4 className="font-medium mb-1">Possible Causes:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {errorAnalysis.possibleCauses.map((cause, index) => (
                    <li key={index}>{cause}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Recommendations:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {errorAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="details">Detailed Info</TabsTrigger>
          <TabsTrigger value="storage">Storage Health</TabsTrigger>
          <TabsTrigger value="history">OAuth History</TabsTrigger>
          <TabsTrigger value="debug">Debug Tools</TabsTrigger>
          <TabsTrigger value="logs">Diagnostic Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OAuth State</CardTitle>
              <CardDescription>Current OAuth state from localStorage</CardDescription>
            </CardHeader>
            <CardContent>
              {oauthState ? (
                <div>
                  <p className="font-mono mb-2">{oauthState}</p>
                  <p className="text-sm text-muted-foreground">
                    Having this value is required for successful OAuth callbacks
                  </p>
                </div>
              ) : (
                <p>No OAuth state found in localStorage</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
              <CardDescription>Current session information</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionError ? (
                <div>
                  <h3 className="text-red-600 font-semibold mb-2">Session Error</h3>
                  {renderJSON(sessionError)}
                </div>
              ) : session ? (
                renderJSON(session)
              ) : (
                <p>No active session</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auth Cookies</CardTitle>
              <CardDescription>Authentication-related cookies</CardDescription>
            </CardHeader>
            <CardContent>
              {cookies.length > 0 ? (
                <ul className="space-y-1">
                  {cookies.map((cookie, i) => (
                    <li key={i} className="font-mono text-xs p-1 bg-muted rounded">{cookie}</li>
                  ))}
                </ul>
              ) : (
                <p>No authentication cookies found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LocalStorage</CardTitle>
              <CardDescription>Authentication-related localStorage items</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(storageData).length > 0 ? (
                renderJSON(storageData)
              ) : (
                <p>No authentication data found in localStorage</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="storage" className="space-y-6">
          {storageHealth ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>LocalStorage Health</CardTitle>
                  <CardDescription>Status of browser localStorage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${storageHealth.localStorage.healthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{storageHealth.localStorage.healthy ? 'Healthy' : 'Issues Detected'}</span>
                  </div>
                  
                  {storageHealth.localStorage.issues.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {storageHealth.localStorage.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No issues detected with localStorage</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cookies Health</CardTitle>
                  <CardDescription>Status of browser cookies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${storageHealth.cookies.healthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{storageHealth.cookies.healthy ? 'Healthy' : 'Issues Detected'}</span>
                  </div>
                  
                  {storageHealth.cookies.issues.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {storageHealth.cookies.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No issues detected with cookies</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>SessionStorage Health</CardTitle>
                  <CardDescription>Status of browser sessionStorage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${storageHealth.sessionStorage.healthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{storageHealth.sessionStorage.healthy ? 'Healthy' : 'Issues Detected'}</span>
                  </div>
                  
                  {storageHealth.sessionStorage.issues.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {storageHealth.sessionStorage.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600">No issues detected with sessionStorage</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center p-4">
              <p>Storage health information loading...</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Debug History</CardTitle>
              <CardDescription>Record of recent OAuth authentication attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {debugHistory.length > 0 ? (
                <div className="space-y-4">
                  {debugHistory.map((entry, i) => (
                    <div key={i} className={`p-3 rounded-md border ${entry.success ? 'border-green-300 bg-green-50 dark:bg-green-950' : 'border-red-300 bg-red-50 dark:bg-red-950'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {entry.provider} OAuth {entry.success ? 'Success' : 'Failure'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-xs mt-2">
                        <div><strong>State:</strong> {entry.state || 'None'}</div>
                        <div><strong>Redirect URL:</strong> {entry.redirectUrl}</div>
                        {entry.error && <div className="text-red-600"><strong>Error:</strong> {entry.error}</div>}
                        {entry.errorDescription && <div className="text-red-600"><strong>Details:</strong> {entry.errorDescription}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No OAuth debug history found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test OAuth Authentication</CardTitle>
              <CardDescription>
                Start an OAuth flow to test the authentication process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                This will redirect you to the selected provider for authentication.
                You will be redirected back to this page after completion.
              </p>
              <div className="flex flex-wrap gap-3">
                {oauthProviders.map(provider => (
                  <Button 
                    key={provider} 
                    onClick={() => testOAuthFlow(provider)}
                    className="capitalize"
                  >
                    Test {provider}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clear Authentication Data</CardTitle>
              <CardDescription>
                Remove all authentication-related data from the browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                This will clear all OAuth tokens, session data, and authentication state.
                Use this to start fresh when debugging authentication issues.
              </p>
              <Button variant="destructive" onClick={clearAuthData}>
                Clear All Auth Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Logs</CardTitle>
              <CardDescription>
                Activity log with timestamps for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              {diagnosticLogs.length > 0 ? (
                <div className="bg-muted p-2 rounded-md font-mono text-xs overflow-auto max-h-[500px]">
                  {diagnosticLogs.map((log, i) => (
                    <div key={i} className="border-b border-border py-1">{log}</div>
                  ))}
                </div>
              ) : (
                <p>No diagnostic logs recorded yet</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(diagnosticLogs.join('\n'))
                  toast.success('Logs copied to clipboard')
                }}
                className="text-sm"
              >
                Copy Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AuthDebugPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 flex justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <AuthDebugContent />
    </Suspense>
  )
} 