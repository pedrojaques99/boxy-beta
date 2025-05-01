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
import { PLANS, formatPrice, getPlanInterval } from '@/lib/plans'

export function PricingSection() {
  const t = useTranslations('plans')
  const user = useUser()
  const [isAnnualOpen, setIsAnnualOpen] = useState(false)
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false)

  if (!t?.home?.pricing?.plans) return null

  const PricingCard = ({ 
    plan, 
    isHighlighted = false, 
    delay = 0,
    isOpen,
    setIsOpen,
    planId
  }: {
    plan: any
    isHighlighted?: boolean
    delay?: number
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    planId: string
  }) => {
    const planData = PLANS[planId]
    if (!planData) return null

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
              <h3 className="text-2xl font-bold mb-2">{t(`${planId}.name`)}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {getPlanInterval(planData)}
              </p>
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  {formatPrice(planData.price)}
                </span>
              </div>
            </div>

            {/* Features List */}
            <ul className="space-y-4 mb-8 flex-grow">
              {planData.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <Check className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isHighlighted ? "text-primary" : "text-primary/80"
                  )} />
                  <span>{t(`${planId}.features.${feature.toLowerCase().replace(/\s+/g, '_')}`)}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full mt-auto"
                  variant={isHighlighted ? "default" : "outline"}
                  onClick={() => setIsOpen(true)}
                >
                  {t(`${planId}.button`)}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <CheckoutWizard defaultPlanId={planId}/>
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
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            plan={t.home.pricing.plans.free}
            delay={0.1}
            isOpen={false}
            setIsOpen={() => {}}
            planId="free"
          />
          <PricingCard
            plan={t.home.pricing.plans.annual}
            isHighlighted
            delay={0.2}
            isOpen={isAnnualOpen}
            setIsOpen={setIsAnnualOpen}
            planId="yearly"
          />
          <PricingCard
            plan={t.home.pricing.plans.monthly}
            delay={0.3}
            isOpen={isMonthlyOpen}
            setIsOpen={setIsMonthlyOpen}
            planId="monthly"
          />
        </div>
      </div>
    </section>
  )
}
