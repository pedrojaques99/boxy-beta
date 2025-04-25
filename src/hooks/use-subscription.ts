import { createClient } from '../lib/supabase/client'
import { useEffect, useState } from 'react'

export type SubscriptionType = 'free' | 'premium'

export function useSubscription() {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('free')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_type')
          .eq('id', user.id)
          .single()

        if (profile?.subscription_type) {
          setSubscriptionType(profile.subscription_type as SubscriptionType)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const canAccessProduct = (productType: string) => {
    if (subscriptionType === 'premium') return true
    return productType === 'free'
  }

  return {
    subscriptionType,
    loading,
    canAccessProduct,
    isPremium: subscriptionType === 'premium'
  }
} 