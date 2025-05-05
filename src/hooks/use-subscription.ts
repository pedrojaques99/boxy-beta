'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import { getAuthService } from '@/lib/auth/auth-service'

export function useSubscription() {
  const user = useUser()
  const authService = getAuthService()
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setSubscription(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await authService.getUserSubscription(user.id)
        setSubscription(data)
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [user, authService])

  // Determine subscription type based on subscription data
  const subscriptionType = subscription?.plan_id === 'premium' || 
                          subscription?.plan_id === 'annual' ? 
                          'premium' : 'free'

  return { subscription, isLoading, subscriptionType }
} 