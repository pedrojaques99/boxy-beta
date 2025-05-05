'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog'
import { useState } from 'react'
import { PLANS, formatPrice, getPlanInterval, PlanId } from '@/lib/plans'
import type { Plan } from '@/types/subscription'

type PlanTranslation = {
  name: string
  price: string
  features: string[]
  button: string
  monthly?: string
}

export function PricingSection() {
  const { t } = useTranslations()
  const user = useUser()
  const [isAnnualOpen, setIsAnnualOpen] = useState(false)
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | undefined>()

  if (!t?.home?.pricing?.plans) return null

  const PricingCard = ({ 
    planId,
    isHighlighted = false, 
    delay = 0,
    isOpen,
    setIsOpen,
  }: {
    planId: PlanId
    isHighlighted?: boolean
    delay?: number
    isOpen: boolean
    setIsOpen: (open: boolean) => void
  }) => {
    const planData = PLANS[planId]
    if (!planData) return null

    const planTranslations = t.home.pricing.plans[planId] as PlanTranslation
    if (!planTranslations) return null

    const features = planTranslations.features || []
    if (!Array.isArray(features)) return null

    const handleDialogOpen = async (open: boolean) => {
      if (open) {
        setIsDialogLoading(true)
        // Ensure loading state is visible and component is mounted
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (!open) {
        // Reset loading state when dialog closes
        setIsDialogLoading(false)
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn("pt-4", isHighlighted && "md:-mt-4")}
      >
        <Card className={cn(
          "h-full relative overflow-hidden",
          "border-2 transition-all duration-300",
          isHighlighted 
            ? "border-primary shadow-lg" 
            : "border-border/50 hover:border-primary/20 hover:shadow-lg"
        )}>
          {isHighlighted && (
            <div className="absolute -top-4 right-6 bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full font-medium shadow-lg">
              +12% OFF
            </div>
          )}
          <CardContent className="p-8 h-full flex flex-col">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{planTranslations.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {planId === 'free' ? 'Forever free' : planTranslations.monthly || ''}
              </p>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  {planTranslations.price}
                </span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-8 flex-grow">
              {features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <Check className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isHighlighted ? "text-primary" : "text-primary/80"
                  )} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full mt-auto"
                  variant={isHighlighted ? "default" : "outline"}
                  disabled={isDialogLoading}
                >
                  {isDialogLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    planTranslations.button
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                {isDialogLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <CheckoutWizard 
                    defaultPlanId={planId}
                    onSuccess={() => {
                      setIsOpen(false)
                      setIsDialogLoading(false)
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            {t.home.pricing.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.home.pricing.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            planId="free"
            delay={0.1}
            isOpen={false}
            setIsOpen={() => {}}
          />
          <PricingCard
            planId="annual"
            isHighlighted
            delay={0.2}
            isOpen={isAnnualOpen}
            setIsOpen={setIsAnnualOpen}
          />
          <PricingCard
            planId="monthly"
            delay={0.3}
            isOpen={isMonthlyOpen}
            setIsOpen={setIsMonthlyOpen}
          />
        </div>
      </div>
    </section>
  )
}
