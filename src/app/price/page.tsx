'use client';

import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { PricingSection } from '@/components/home/pricing-section'
import { useTranslations } from '@/hooks/use-translations'

export default function PricePage() {
  const { t } = useTranslations()
  const user = useUser()
  const router = useRouter()

  if (!t?.home?.pricing) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <PricingSection />
    </div>
  )
} 