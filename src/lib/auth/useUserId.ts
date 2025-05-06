"use client"
import { useEffect, useState } from "react"
import { getAuthService } from "./auth-service"

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    const authService = getAuthService()

    const fetchUserId = async () => {
      try {
        const { data, error } = await authService.getUser()
        if (mounted) {
          if (error) throw error
          setUserId(data?.user?.id ?? null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch user ID'))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchUserId()

    return () => {
      mounted = false
    }
  }, [])

  return { userId, isLoading, error }
} 