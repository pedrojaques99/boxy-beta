'use client';

import { PricingSection } from '@/components/home/pricing-section'
import { useTranslations } from '@/hooks/use-translations'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function PricePage() {
  const { t } = useTranslations()
  const [isClient, setIsClient] = useState(false)
  
  // Ensure we're on the client before rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!t?.home?.pricing) return null

  return <PricingSection />
} 