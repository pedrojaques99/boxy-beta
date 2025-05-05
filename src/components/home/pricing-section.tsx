'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { Check, AlertCircle } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { PLANS, formatPrice, getPlanInterval, PlanId } from '@/lib/plans'
import type { Plan } from '@/types/subscription'
import { getAuthService } from '@/lib/auth/auth-service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getAuthService } from '@/lib/auth/auth-service'

type PlanTranslation = {
  name: string
  price: string
  features: string[]
  button: string
  monthly?: string
}

type Subscription = {
  id: string
  user_id: string
  plan_id: string
  pagarme_subscription_id: string
  status: string
  started_at: string
  current_period_end: string
  updated_at: string
}

export function PricingSection() {
  const { t, locale } = useTranslations()
  const [user, setUser] = useState<any>(null)
  const [isAnnualOpen, setIsAnnualOpen] = useState(false)
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | undefined>()
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const authService = getAuthService()
  const authService = getAuthService()

  // Verificar autenticação primeiro
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sessão usando AuthService
        const { data, error } = await authService.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          setAuthChecked(true)
          setIsLoading(false)
          return
        }
        
        if (!data.session) {
          console.log('Nenhuma sessão encontrada')
          setAuthChecked(true)
          setIsLoading(false)
          return
        }
        
        console.log('Sessão válida encontrada')
        setUser(data.session.user)
        setAuthChecked(true)
        
        // Continuar com a verificação de assinatura apenas se o usuário estiver autenticado
        await checkSubscription(data.session.user.id)
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err)
        setAuthChecked(true)
        setIsLoading(false)
      }
    }
    
    const checkSubscription = async (userId: string) => {
      if (!userId) {
        setIsLoading(false)
        return
      }
      
      try {
        // Verificar assinatura usando AuthService
        const subscription = await authService.getUserSubscription(userId)
        if (subscription) {
          setUserSubscription(subscription as Subscription)
          console.log('Assinatura encontrada:', subscription)
        } else {
          console.log('Nenhuma assinatura ativa encontrada')
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error)
      } finally {
        // Pequeno atraso antes de esconder o carregamento para uma melhor UX
        setTimeout(() => {
          setIsLoading(false)
        }, 300)
      }
    }

    if (!authChecked) {
      checkAuth()
    }
  }, [authService, authChecked])

  // Fazer nova verificação quando o usuário mudar (login/logout)
  useEffect(() => {
    if (authChecked && user?.id) {
      console.log('Usuário alterado, verificando assinatura novamente')
      setIsLoading(true)
      // Tentar buscar a assinatura novamente se o usuário estiver autenticado
      const checkUserSubscription = async () => {
        try {
          const subscription = await authService.getUserSubscription(user.id)
          if (subscription) {
            setUserSubscription(subscription as Subscription)
            console.log('Assinatura encontrada:', subscription)
          } else {
            // Limpar assinatura caso não encontre
            setUserSubscription(null)
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura:', error)
        } finally {
          setTimeout(() => {
            setIsLoading(false)
          }, 300)
        }
      }
      
      checkUserSubscription()
    } else if (authChecked && !user) {
      // Se não houver usuário, limpar dados de assinatura
      setUserSubscription(null)
      setIsLoading(false)
    }
  }, [user, authService, authChecked])

  if (!t?.home?.pricing?.plans) return null

  const PricingCard = ({ 
    planId,
    isHighlighted = false, 
    delay = 0,
  }: {
    planId: PlanId
    isHighlighted?: boolean
    delay?: number
  }) => {
    const planData = PLANS[planId]
    if (!planData) return null

    const planTranslations = t.home.pricing.plans[planId] as PlanTranslation
    if (!planTranslations) return null

    const features = planTranslations.features || []
    if (!Array.isArray(features)) return null

    // Verificar se o usuário já tem este plano
    const isCurrentPlan = userSubscription?.plan_id === planId
    // Verificar se o usuário tem qualquer outro plano pago (menos o free)
    const hasActivePaidPlan = userSubscription && planId !== 'free' && userSubscription.plan_id !== planId

    const handleSubscribe = async () => {
      // If free plan, do nothing
      if (planId === 'free') return

      // Check for session first
      try {
        const isAuthenticated = await authService.isAuthenticated()
        if (!isAuthenticated) {
          // Redirect to login if no session
          window.location.href = '/auth/login?redirect=/checkout/' + planId
          return
        }
        
        // If user has an active paid plan, redirect to profile
        if (hasActivePaidPlan) {
          window.location.href = '/profile'
          return
        }
        
        // Otherwise redirect to the checkout page for this plan
        window.location.href = '/checkout/' + planId
      } catch (err) {
        console.error('Erro ao verificar sessão:', err)
        window.location.href = '/auth/login?redirect=/checkout/' + planId
      }
    }

    // Texto do botão baseado no status da assinatura
    let buttonText = planTranslations.button
    if (isCurrentPlan) {
      buttonText = 'Plano Atual'
    } else if (hasActivePaidPlan) {
      buttonText = 'Mudar Plano'
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
          isCurrentPlan 
            ? "border-green-500 shadow-lg" 
            : isHighlighted 
              ? "border-primary shadow-lg" 
              : "border-border/50 hover:border-primary/20 hover:shadow-lg"
        )}>
          {isHighlighted && !isCurrentPlan && (
            <div className="absolute -top-4 right-6 bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full font-medium shadow-lg">
              +12% OFF
            </div>
          )}
          {isCurrentPlan && (
            <div className="absolute -top-4 right-6 bg-green-500 text-white text-sm px-4 py-1.5 rounded-full font-medium shadow-lg">
              Plano Atual
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
                    isCurrentPlan ? "text-green-500" : isHighlighted ? "text-primary" : "text-primary/80"
                  )} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <Button 
              className="w-full mt-auto"
              variant={isCurrentPlan ? "outline" : isHighlighted ? "default" : "outline"}
              disabled={isCurrentPlan || isLoading || (planId === 'free')}
              onClick={handleSubscribe}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                buttonText
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-muted-foreground">Verificando seu status de assinatura...</p>
          </div>
        ) : (
          <>
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
              {userSubscription && (
                <div className="mt-4 inline-block">
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <Check className="h-4 w-4 text-green-500" />
                    <AlertTitle>Você já possui uma assinatura ativa</AlertTitle>
                    <AlertDescription>
                      Seu plano atual: {PLANS[userSubscription.plan_id as PlanId]?.name || userSubscription.plan_id}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                planId="free"
                delay={0.1}
              />
              <PricingCard
                planId="annual"
                isHighlighted
                delay={0.2}
              />
              <PricingCard
                planId="monthly"
                delay={0.3}
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
