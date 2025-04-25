'use client';

import { PricingSection } from "@/components/home/pricing-section";
import { useTranslations } from "@/hooks/use-translations";

export default function PricePage() {
  const { t } = useTranslations();

  if (!t) return null; // Wait for translations to load

  return (
    <div className="w-full h-full bg-background">
      <div className="relative z-10">
        <PricingSection />
      </div>
    </div>
  );
} 