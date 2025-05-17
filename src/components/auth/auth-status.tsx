'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Bug } from 'lucide-react'

export function AuthStatus() {
  const { user, loading, isAuthenticated, signOut } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  if (loading) {
    return (
      <div className="flex items-center text-xs text-muted-foreground">
        <span className="animate-pulse">Checking auth...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        {isDev && (
          <Link href="/auth-debug" className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors">
            <Bug className="h-3 w-3" />
            <span>Auth Debug</span>
          </Link>
        )}
        <Link href="/auth/login">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {isDev && (
        <Link href="/auth-debug" className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors">
          <Bug className="h-3 w-3" />
          <span>Auth Debug</span>
        </Link>
      )}
      
      <div 
        className="text-xs flex items-center gap-1 cursor-pointer"
        onMouseEnter={() => setShowDebug(true)}
        onMouseLeave={() => setShowDebug(false)}
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="max-w-[100px] truncate">{user?.email}</span>
        
        {showDebug && isDev && (
          <div className="absolute mt-16 p-3 bg-card border border-border rounded-md shadow-lg z-50 text-xs">
            <div className="font-medium mb-1">Auth Debug Info</div>
            <div className="text-muted-foreground mb-2">User ID: {user?.id}</div>
            <div className="text-muted-foreground">Provider: {user?.app_metadata?.provider || 'email'}</div>
          </div>
        )}
      </div>
      
      <Button variant="outline" size="sm" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  )
} 