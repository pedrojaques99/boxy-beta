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

const STEPS = ['plan', 'user', 'payment', 'confirm', 'result'] as const
type Step = typeof STEPS[number]

interface CheckoutWizardProps {
  defaultPlanId?: PlanId
  onSuccess?: () => void
}

export function CheckoutWizard({ defaultPlanId, onSuccess }: CheckoutWizardProps) {
  const user = useUser()
  const router = useRouter()
  const { t } = useTranslations()
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
        <h3 className="text-lg font-semibold">Authentication Required</h3>
        <p>Please log in to continue with your subscription.</p>
        <Button onClick={() => router.push('/auth/login')}>
          Login
        </Button>
      </div>
    )
  }

  const stepTitles: Record<Step, string> = {
    plan: 'Choose Your Plan',
    user: 'Personal Information',
    payment: 'Payment Details',
    confirm: 'Review & Confirm',
    result: result.success ? 'Success!' : 'Error'
  }

  const stepIcons: Record<Step, JSX.Element> = {
    plan: <CreditCard className="h-5 w-5" />,
    user: <User className="h-5 w-5" />,
    payment: <Lock className="h-5 w-5" />,
    confirm: <Check className="h-5 w-5" />,
    result: result.success ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />
  }

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="mb-8">
        <Progress value={(step / (STEPS.length - 1)) * 100} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {stepIcons[STEPS[step]]}
                {stepTitles[STEPS[step]]}
              </CardTitle>
              {step > 0 && step < 4 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Plan: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                        <span className="text-sm text-muted-foreground">{plan.price}</span>
                      </div>
                    </Button>
                  ))}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Full Name</Label>
                    <Input
                      id="user-name"
                      placeholder="Your name"
                      value={userData.name}
                      onChange={e => setUserData({ ...userData, name: e.target.value })}
                      className={cn(userData.name.length === 0 && 'border-red-500')}
                    />
                    {userData.name.length === 0 && <span className="text-xs text-red-500">Name is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      placeholder="your@email.com"
                      value={userData.email}
                      onChange={e => setUserData({ ...userData, email: e.target.value })}
                      className={cn(userData.email.length === 0 && 'border-red-500')}
                    />
                    {userData.email.length === 0 && <span className="text-xs text-red-500">Email is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-street">Street</Label>
                    <Input
                      id="user-street"
                      value={userData.street}
                      onChange={e => setUserData({ ...userData, street: e.target.value })}
                      className={cn(userData.street.length === 0 && 'border-red-500')}
                    />
                    {userData.street.length === 0 && <span className="text-xs text-red-500">Street is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-number">Number</Label>
                    <Input
                      id="user-number"
                      value={userData.number}
                      onChange={e => setUserData({ ...userData, number: e.target.value })}
                      className={cn(userData.number.length === 0 && 'border-red-500')}
                    />
                    {userData.number.length === 0 && <span className="text-xs text-red-500">Number is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-complement">Complement</Label>
                    <Input
                      id="user-complement"
                      value={userData.complement}
                      onChange={e => setUserData({ ...userData, complement: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-zip">ZIP Code</Label>
                    <Input
                      id="user-zip"
                      value={userData.zip_code}
                      onChange={e => setUserData({ ...userData, zip_code: e.target.value.replace(/\D/g, '') })}
                      maxLength={8}
                      className={cn(userData.zip_code.length > 0 && userData.zip_code.length < 8 && 'border-red-500')}
                    />
                    {userData.zip_code.length > 0 && userData.zip_code.length < 8 && <span className="text-xs text-red-500">Invalid ZIP code</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-neighborhood">Neighborhood</Label>
                    <Input
                      id="user-neighborhood"
                      value={userData.neighborhood}
                      onChange={e => setUserData({ ...userData, neighborhood: e.target.value })}
                      className={cn(userData.neighborhood.length === 0 && 'border-red-500')}
                    />
                    {userData.neighborhood.length === 0 && <span className="text-xs text-red-500">Neighborhood is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-city">City</Label>
                    <Input
                      id="user-city"
                      value={userData.city}
                      onChange={e => setUserData({ ...userData, city: e.target.value })}
                      className={cn(userData.city.length === 0 && 'border-red-500')}
                    />
                    {userData.city.length === 0 && <span className="text-xs text-red-500">City is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-state">State</Label>
                    <Input
                      id="user-state"
                      value={userData.state}
                      onChange={e => setUserData({ ...userData, state: e.target.value })}
                      maxLength={2}
                      className={cn(userData.state.length > 0 && userData.state.length < 2 && 'border-red-500')}
                    />
                    {userData.state.length > 0 && userData.state.length < 2 && <span className="text-xs text-red-500">Invalid state</span>}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                      maxLength={16}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.number.length > 0 && card.number.length < 16 && 'border-red-500')}
                    />
                    {card.number.length > 0 && card.number.length < 16 && <span className="text-xs text-red-500">Invalid card number</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Cardholder Name</Label>
                    <Input
                      id="card-name"
                      placeholder="John Doe"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.name.length === 0 && 'border-red-500')}
                    />
                    {card.name.length === 0 && <span className="text-xs text-red-500">Name is required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cpf">CPF</Label>
                    <Input
                      id="card-cpf"
                      placeholder="00000000000"
                      value={card.cpf}
                      onChange={e => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                      maxLength={11}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.cpf.length > 0 && card.cpf.length < 11 && 'border-red-500')}
                    />
                    {card.cpf.length > 0 && card.cpf.length < 11 && <span className="text-xs text-red-500">Invalid CPF</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
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
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.expiry.length > 0 && card.expiry.length < 5 && 'border-red-500')}
                    />
                    {card.expiry.length > 0 && card.expiry.length < 5 && <span className="text-xs text-red-500">Invalid expiry date</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvv">CVV</Label>
                    <Input
                      id="card-cvv"
                      placeholder="123"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                      maxLength={4}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.cvv.length > 0 && card.cvv.length < 3 && 'border-red-500')}
                    />
                    {card.cvv.length > 0 && card.cvv.length < 3 && <span className="text-xs text-red-500">Invalid CVV</span>}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                    <div className="text-lg font-semibold mb-2">Confirm Your Details</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Plan: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div><b>Name:</b> {userData.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div><b>Address:</b> {userData.street}, {userData.number} {userData.complement && `- ${userData.complement}`}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div><b>Location:</b> {userData.neighborhood}, {userData.city} - {userData.state}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <div><b>Card:</b> **** **** **** {card.number.slice(-4)}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 text-center"
                >
                  {result.success ? (
                    <>
                      <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <div className="text-lg font-semibold mb-2">Subscription Created Successfully!</div>
                      <div className="text-muted-foreground">Welcome to the {planId && PLANS[planId].name} plan.</div>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 text-2xl">Error</span>
                      <div className="text-muted-foreground mt-2 break-words max-w-xs mx-auto">{result.message || 'Error processing subscription.'}</div>
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
                Back
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
                      Next
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
                      Confirm
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

