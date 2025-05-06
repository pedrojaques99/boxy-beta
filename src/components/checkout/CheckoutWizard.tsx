/*
  CheckoutWizard.tsx
  - 3 etapas: Plano > Cartão > Confirmação
  - Estilo integrado com shadcn/ui e globals.css do Boxy
*/

'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/hooks/use-translations'
import { Check, ArrowLeft, CreditCard, User, MapPin, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PlanId, PLANS } from '@/lib/plans'
import { handleError } from '@/lib/error-handler'
import { Progress } from '@/components/ui/progress'
import { getAuthService } from '@/lib/auth/auth-service'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/hooks/use-locale'
import type { Dictionary } from '@/i18n/types'
import { Database } from '@/types/supabase'

const STEPS = ['plan', 'user', 'payment', 'confirm', 'result'] as const
type Step = typeof STEPS[number]

interface CheckoutWizardProps {
  defaultPlanId?: PlanId
  onSuccess?: () => void
}

export function CheckoutWizard({ defaultPlanId, onSuccess }: CheckoutWizardProps) {
  const user = useUser()
  const router = useRouter()
  const { t, locale } = useTranslations()
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState<PlanId | undefined>(defaultPlanId)
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    zip_code: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'BR'
  })
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: ''
  })
  const [result, setResult] = useState<{ success: boolean, message: string }>({ success: false, message: '' })
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const authService = getAuthService()
  const supabaseClient = createClient()

  // Add safe translation function with proper typing
  const safeT = (key: string): string => {
    if (!t) return key
    const keys = key.split('.')
    let value: any = t
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }
    return typeof value === 'string' ? value : key
  }

  // Log to help debug initialization
  console.log('CheckoutWizard inicializado', { 
    defaultPlanId, 
    planId,
    user: user ? 'logado' : 'não logado', 
    authLoading, 
    mounted 
  })

  // Populate user data when available
  useEffect(() => {
    const getUserProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar perfil:', error)
          return
        }

        if (data) {
          setUserData(prev => ({
            ...prev,
            name: data.name || user?.user_metadata?.full_name || '',
            email: user?.email || '',
          }))
        }
      } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err)
      }
    }

    if (user) {
      getUserProfile()
    }
  }, [user])

  // Initialization effect
  useEffect(() => {
    setMounted(true)
    console.log('CheckoutWizard montado')
    
    // Guarantee planId is set from prop
    if (defaultPlanId && !planId) {
      console.log('Definindo planId a partir do defaultPlanId:', defaultPlanId)
      setPlanId(defaultPlanId)
    }
    
    // Add a timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      if (authLoading) {
        console.log('Timeout de autenticação, forçando continuar')
        setAuthLoading(false)
      }
    }, 3000) // reduzido para 3 segundos
    
    return () => {
      console.log('CheckoutWizard desmontado')
      setMounted(false)
      clearTimeout(authTimeout)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [defaultPlanId, planId])

  // Auth state effect - make it more reliable
  useEffect(() => {
    // Check Supabase session directly
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          setAuthLoading(false)
          return
        }
        
        if (session) {
          console.log('Sessão encontrada, usuário autenticado')
          setAuthLoading(false)
        } else if (mounted) {
          console.log('Sem sessão ativa')
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err)
        setAuthLoading(false)
      }
    }

    if (mounted) {
      checkAuth()
    }
    
    // Fallback to user hook
    if (user !== null && mounted) {
      console.log('Usuário autenticado via hook, terminando authLoading')
      setAuthLoading(false)
    }
  }, [user, mounted])

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleNext = async () => {
    if (step === STEPS.length - 1) {
      setLoading(true)
      
      // Set a timeout to prevent infinite loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        if (mounted && loading) {
          setLoading(false)
          toast.error("Request timed out. Please try again later.")
        }
      }, 15000) // 15 seconds maximum for payment processing
      
      try {
        // Verificar sessão atual para garantir autenticação
        const { data: { session } } = await supabaseClient.auth.getSession()
        
        if (!session) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.')
        }

        if (!user?.id || !user?.email) {
          throw new Error('Dados do usuário incompletos. Por favor, faça login novamente.')
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout
        
        const res = await fetch('/api/pagarme/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            plan_id: planId,
            payment_method: 'credit_card',
            card: {
              holder_name: card.name,
              number: card.number,
              exp_month: card.expiry.split('/')[0],
              exp_year: card.expiry.split('/')[1],
              cvv: card.cvv,
              cpf: card.cpf
            },
            billing_address: {
              street: userData.street,
              number: userData.number,
              complement: userData.complement,
              zip_code: userData.zip_code,
              neighborhood: userData.neighborhood,
              city: userData.city,
              state: userData.state,
              country: userData.country
            }
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to process payment')
        }

        if (mounted) {
          setResult({ success: true, message: 'Subscription created successfully!' })
          toast.success('Subscription created successfully!')
          onSuccess?.()
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
          setResult({ success: false, message: errorMessage })
          toast.error(errorMessage)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
            loadingTimeoutRef.current = null
          }
        }
      }
    } else {
      setStep(step + 1)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 0:
        return !!planId
      case 1:
        return (
          userData.name.length > 0 &&
          userData.email.length > 0 &&
          userData.street.length > 0 &&
          userData.number.length > 0 &&
          userData.zip_code.length === 8 &&
          userData.neighborhood.length > 0 &&
          userData.city.length > 0 &&
          userData.state.length === 2
        )
      case 2:
        return (
          card.number.length === 16 &&
          card.name.length > 0 &&
          card.expiry.length === 5 &&
          card.cvv.length >= 3 &&
          card.cpf.length === 11
        )
      case 3:
        return true
      default:
        return false
    }
  }

  // Format currency based on locale
  const formatCurrency = (amount: number) => {
    const formatter = new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: locale === 'pt-BR' ? 'BRL' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return formatter.format(amount)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="space-y-4 p-8 text-center">
        <h3 className="text-lg font-semibold">{safeT('checkout.authRequired')}</h3>
        <p>{safeT('checkout.authRequiredDescription')}</p>
        <Button onClick={() => router.push('/auth/login')}>
          {safeT('checkout.login')}
        </Button>
      </div>
    )
  }

  const stepTitles: Record<Step, string> = {
    plan: safeT('checkout.selectPlan'),
    user: safeT('profile.subscription.title'),
    payment: safeT('checkout.paymentDetails'),
    confirm: safeT('checkout.confirm'),
    result: result.success ? safeT('auth.signUpSuccess.title') : safeT('auth.error.title')
  }

  const stepIcons: Record<Step, JSX.Element> = {
    plan: <CreditCard className="h-5 w-5" />,
    user: <User className="h-5 w-5" />,
    payment: <Lock className="h-5 w-5" />,
    confirm: <Check className="h-5 w-5" />,
    result: result.success ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />
  }

  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <div className="mb-10">
        <Progress value={(step / (STEPS.length - 1)) * 100} className="h-2" />
        <div className="flex justify-between mt-4 text-sm text-muted-foreground">
          {STEPS.map((stepKey, index) => (
            <div
              key={stepKey}
              className={cn(
                "flex items-center gap-2",
                index <= step ? "text-primary" : "text-muted-foreground"
              )}
            >
              {stepIcons[stepKey]}
              <span className="hidden sm:inline">{stepTitles[stepKey]}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-lg border-2 border-primary/10">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                {stepIcons[STEPS[step]]}
                {stepTitles[STEPS[step]]}
              </CardTitle>
              {step > 0 && step < 4 && (
                <div className="text-sm text-muted-foreground mt-2">
                  {safeT('checkout.plan')}: <b>{planId && PLANS[planId].name}</b> — {planId && formatCurrency(PLANS[planId].price)}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto px-6">
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {Object.entries(PLANS).map(([id, plan]) => (
                    <Button
                      key={id}
                      variant={planId === id ? 'default' : 'outline'}
                      className={cn(
                        "w-full justify-start p-6 h-auto",
                        planId === id && "border-primary"
                      )}
                      onClick={() => setPlanId(id as PlanId)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(plan.price)}</span>
                      </div>
                    </Button>
                  ))}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="user-name">{safeT('checkout.name')}</Label>
                    <Input
                      id="user-name"
                      placeholder={safeT('checkout.namePlaceholder')}
                      value={userData.name}
                      onChange={e => setUserData({ ...userData, name: e.target.value })}
                      className={cn('text-foreground bg-background', userData.name.length === 0 && 'border-red-500')}
                    />
                    {userData.name.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.nameRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">{safeT('checkout.email')}</Label>
                    <Input
                      id="user-email"
                      placeholder={safeT('checkout.emailPlaceholder')}
                      value={userData.email}
                      onChange={e => setUserData({ ...userData, email: e.target.value })}
                      className={cn('text-foreground bg-background', userData.email.length === 0 && 'border-red-500')}
                    />
                    {userData.email.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.emailRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-street">{safeT('checkout.street')}</Label>
                    <Input
                      id="user-street"
                      placeholder={safeT('checkout.streetPlaceholder')}
                      value={userData.street}
                      onChange={e => setUserData({ ...userData, street: e.target.value })}
                      className={cn('text-foreground bg-background', userData.street.length === 0 && 'border-red-500')}
                    />
                    {userData.street.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.streetRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-number">{safeT('checkout.number')}</Label>
                    <Input
                      id="user-number"
                      placeholder={safeT('checkout.numberPlaceholder')}
                      value={userData.number}
                      onChange={e => setUserData({ ...userData, number: e.target.value })}
                      className={cn('text-foreground bg-background', userData.number.length === 0 && 'border-red-500')}
                    />
                    {userData.number.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.numberRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-complement">{safeT('checkout.complement')}</Label>
                    <Input
                      id="user-complement"
                      placeholder={safeT('checkout.complementPlaceholder')}
                      value={userData.complement}
                      onChange={e => setUserData({ ...userData, complement: e.target.value })}
                      className="text-foreground bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-zip">{safeT('checkout.zip')}</Label>
                    <Input
                      id="user-zip"
                      placeholder={safeT('checkout.zipPlaceholder')}
                      value={userData.zip_code}
                      onChange={e => setUserData({ ...userData, zip_code: e.target.value.replace(/\D/g, '') })}
                      maxLength={8}
                      className={cn('text-foreground bg-background', userData.zip_code.length > 0 && userData.zip_code.length < 8 && 'border-red-500')}
                    />
                    {userData.zip_code.length > 0 && userData.zip_code.length < 8 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidZip')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-neighborhood">{safeT('checkout.neighborhood')}</Label>
                    <Input
                      id="user-neighborhood"
                      placeholder={safeT('checkout.neighborhoodPlaceholder')}
                      value={userData.neighborhood}
                      onChange={e => setUserData({ ...userData, neighborhood: e.target.value })}
                      className={cn('text-foreground bg-background', userData.neighborhood.length === 0 && 'border-red-500')}
                    />
                    {userData.neighborhood.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.neighborhoodRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-city">{safeT('checkout.city')}</Label>
                    <Input
                      id="user-city"
                      placeholder={safeT('checkout.cityPlaceholder')}
                      value={userData.city}
                      onChange={e => setUserData({ ...userData, city: e.target.value })}
                      className={cn('text-foreground bg-background', userData.city.length === 0 && 'border-red-500')}
                    />
                    {userData.city.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.cityRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-state">{safeT('checkout.state')}</Label>
                    <Input
                      id="user-state"
                      placeholder={safeT('checkout.statePlaceholder')}
                      value={userData.state}
                      onChange={e => setUserData({ ...userData, state: e.target.value })}
                      maxLength={2}
                      className={cn('text-foreground bg-background', userData.state.length > 0 && userData.state.length < 2 && 'border-red-500')}
                    />
                    {userData.state.length > 0 && userData.state.length < 2 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidState')}</span>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="card-number">{safeT('checkout.cardNumber')}</Label>
                    <Input
                      id="card-number"
                      placeholder={safeT('checkout.cardNumberPlaceholder')}
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                      maxLength={16}
                      className={cn('text-foreground bg-background', card.number.length > 0 && card.number.length < 16 && 'border-red-500')}
                    />
                    {card.number.length > 0 && card.number.length < 16 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidCardNumber')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">{safeT('checkout.cardName')}</Label>
                    <Input
                      id="card-name"
                      placeholder={safeT('checkout.cardNamePlaceholder')}
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      className={cn('text-foreground bg-background', card.name.length === 0 && 'border-red-500')}
                    />
                    {card.name.length === 0 && <span className="text-xs text-red-500">{safeT('checkout.error.cardNameRequired')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cpf">{safeT('checkout.cpf')}</Label>
                    <Input
                      id="card-cpf"
                      placeholder={safeT('checkout.cpfPlaceholder')}
                      value={card.cpf}
                      onChange={e => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                      maxLength={11}
                      className={cn('text-foreground bg-background', card.cpf.length > 0 && card.cpf.length < 11 && 'border-red-500')}
                    />
                    {card.cpf.length > 0 && card.cpf.length < 11 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidCpf')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">{safeT('checkout.expiryDate')}</Label>
                    <Input
                      id="card-expiry"
                      placeholder={safeT('checkout.expiryDatePlaceholder')}
                      value={card.expiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 4) {
                          setCard({
                            ...card,
                            expiry: value.replace(/(\d{2})(\d{0,2})/, '$1/$2')
                          })
                        }
                      }}
                      maxLength={5}
                      className={cn('text-foreground bg-background', card.expiry.length > 0 && card.expiry.length < 5 && 'border-red-500')}
                    />
                    {card.expiry.length > 0 && card.expiry.length < 5 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidExpiry')}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvv">{safeT('checkout.cvv')}</Label>
                    <Input
                      id="card-cvv"
                      placeholder={safeT('checkout.cvvPlaceholder')}
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                      maxLength={4}
                      className={cn('text-foreground bg-background', card.cvv.length > 0 && card.cvv.length < 3 && 'border-red-500')}
                    />
                    {card.cvv.length > 0 && card.cvv.length < 3 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidCvv')}</span>}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <Check className="mx-auto mb-4 h-10 w-10 text-green-500" />
                    <div className="text-xl font-semibold mb-4">{safeT('checkout.confirm')}</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {safeT('checkout.plan')}: <b>{planId && PLANS[planId].name}</b> — {planId && formatCurrency(PLANS[planId].price)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <div><b>{safeT('profile.subscription.title')}:</b> {userData.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" />
                      <div><b>{safeT('checkout.paymentDetails')}:</b> {userData.street}, {userData.number} {userData.complement && `- ${userData.complement}`}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" />
                      <div><b>{safeT('checkout.paymentDetails')}:</b> {userData.neighborhood}, {userData.city} - {userData.state}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div><b>{safeT('checkout.cardNumber')}:</b> **** **** **** {card.number.slice(-4)}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center"
                >
                  {result.success ? (
                    <>
                      <Check className="mx-auto mb-4 h-10 w-10 text-green-500" />
                      <div className="text-xl font-semibold mb-4">{safeT('auth.signUpSuccess.title')}</div>
                      <div className="text-muted-foreground">{safeT('auth.signUpSuccess.description')}</div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
                      <div className="text-xl font-semibold mb-4">{safeT('auth.error.title')}</div>
                      <div className="text-muted-foreground mt-2 break-words max-w-xs mx-auto">{result.message || safeT('auth.error.description')}</div>
                    </>
                  )}
                </motion.div>
              )}
            </CardContent>
            <div className="flex justify-between mt-6 px-6 pb-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || step === 4}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {safeT('checkout.back')}
              </Button>
              {step < 3 && (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || loading}
                  className="gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      {safeT('checkout.next')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      {safeT('checkout.confirm')}
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

