'use client';

import { PricingSection } from '@/components/home/pricing-section'
import { useTranslations } from '@/hooks/use-translations'

export default function PricePage() {
  const { t } = useTranslations()

  if (!t?.home?.pricing) return null

  return <PricingSection />
} 