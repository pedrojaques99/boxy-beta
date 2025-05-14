/*
  CheckoutWizard.tsx
  - 3 etapas: Plano > Cartão > Confirmação
  - Estilo integrado com shadcn/ui e globals.css do Boxy
*/

'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useState, useEffect, useRef, useMemo } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { getAuthService } from '@/lib/auth/auth-service'
import { createClient } from '@/lib/supabase/client'


const STEPS = ['plan', 'user', 'payment', 'confirm', 'result'] as const
type Step = typeof STEPS[number]

interface UserData {
  name: string
  email: string
  street: string
  number: string
  complement: string
  zip_code: string
  neighborhood: string
  city: string
  state: string
  country: string
}

interface CardData {
  number: string
  name: string
  expiry: string
  cvv: string
  cpf: string
}

interface CheckoutWizardProps {
  defaultPlanId?: PlanId
  onSuccess?: () => void
}

// Utility functions
const luhnCheck = (num: string): boolean => {
  let arr = (num + '')
    .split('')
    .reverse()
    .map(x => parseInt(x))
  let lastDigit = arr.splice(0, 1)[0]
  let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0)
  sum += lastDigit
  return sum % 10 === 0
}

const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false

  return true
}

const validateExpiryDate = (expiry: string): boolean => {
  const [month, year] = expiry.split('/')
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear() % 100
  const currentMonth = currentDate.getMonth() + 1

  const expMonth = parseInt(month)
  const expYear = parseInt(year)

  if (expMonth < 1 || expMonth > 12) return false
  if (expYear < currentYear) return false
  if (expYear === currentYear && expMonth < currentMonth) return false

  return true
}

// Format currency based on locale
const formatCurrency = (amount: number, locale: string) => {
  const formatter = new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(amount)
}

// Add this function before the CheckoutWizard component
const fetchAddressByCEP = async (cep: string) => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
};

const StepIcon = ({ 
  step: currentStep, 
  result, 
  currentStepIndex 
}: { 
  step: Step; 
  result: { success: boolean }; 
  currentStepIndex: number;
}) => {
  const icons = {
    plan: CreditCard,
    user: User,
    payment: Lock,
    confirm: Check,
    result: result.success ? Check : AlertCircle
  };
  
  const Icon = icons[currentStep];
  
  return (
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center",
      STEPS.indexOf(currentStep) <= currentStepIndex
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
    )}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

export function CheckoutWizard({ defaultPlanId, onSuccess }: CheckoutWizardProps) {
  const user = useUser()
  const router = useRouter()
  const { t, locale } = useTranslations()
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState<PlanId | undefined>(defaultPlanId)
  const [userData, setUserData] = useState<UserData>({
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
  const [card, setCard] = useState<CardData>({
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

  // Memoize safeT function
  const safeT = useMemo(() => {
    return (key: string): string => {
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
  }, [t])

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
    }, 3000)
    
    // Cleanup function
    return () => {
      console.log('CheckoutWizard desmontado')
      setMounted(false)
      clearTimeout(authTimeout)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      
      // Clear sensitive data
      setCard({
        number: '',
        name: '',
        expiry: '',
        cvv: '',
        cpf: ''
      })
      
      // Clear progress if not completed
      if (step < STEPS.length - 1) {
        localStorage.removeItem('checkout_progress')
      }
    }
  }, [defaultPlanId, planId])

  // Auth state effect - make it more reliable
  useEffect(() => {
    let isSubscribed = true
    
    // Check Supabase session directly
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          if (isSubscribed) {
            setAuthLoading(false)
          }
          return
        }
        
        if (session) {
          console.log('Sessão encontrada, usuário autenticado')
          if (isSubscribed) {
            setAuthLoading(false)
          }
        } else if (mounted && isSubscribed) {
          console.log('Sem sessão ativa')
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err)
        if (isSubscribed) {
          setAuthLoading(false)
        }
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
    
    return () => {
      isSubscribed = false
    }
  }, [user, mounted])

  // Save progress with encryption
  useEffect(() => {
    const saveProgress = () => {
      if (step > 0) {
        // Only save non-sensitive data
        const progressData = {
          step,
          userData: {
            name: userData.name,
            email: userData.email,
            street: userData.street,
            number: userData.number,
            complement: userData.complement,
            zip_code: userData.zip_code,
            neighborhood: userData.neighborhood,
            city: userData.city,
            state: userData.state,
            country: userData.country
          },
          planId,
          timestamp: Date.now()
        }
        
        localStorage.setItem('checkout_progress', JSON.stringify(progressData))
      }
    }

    saveProgress()

    return () => {
      // Clear sensitive data on unmount if not completed
      if (step < STEPS.length - 1) {
        localStorage.removeItem('checkout_progress')
      }
    }
  }, [step, userData, planId])

  useEffect(() => {
    const saveProgress = () => {
      if (step > 0) {
        localStorage.setItem('checkout_progress', JSON.stringify({
          step,
          userData,
          planId,
          timestamp: Date.now()
        }));
      }
    };

    saveProgress();

    return () => {
      // Limpar dados sensíveis ao sair
      if (step === STEPS.length - 1) {
        localStorage.removeItem('checkout_progress');
      }
    };
  }, [step, userData, planId]);

  // Recuperar progresso ao montar
  useEffect(() => {
    const savedProgress = localStorage.getItem('checkout_progress');
    if (savedProgress) {
      const { step: savedStep, userData: savedUserData, planId: savedPlanId, timestamp } = JSON.parse(savedProgress);
      
      // Verificar se o progresso não expirou (24h)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setStep(savedStep);
        setUserData(savedUserData);
        setPlanId(savedPlanId);
        toast.info(safeT('checkout.progressRestored'));
      } else {
        localStorage.removeItem('checkout_progress');
      }
    }
  }, []);

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleNext = async () => {
    if (step === STEPS.length - 1) {
      setLoading(true)
      
      try {
        // Validate session and user data
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        
        if (sessionError) {
          throw new Error(safeT('checkout.error.sessionError'))
        }
        
        if (!session) {
          throw new Error(safeT('checkout.error.sessionExpired'))
        }

        if (!user?.id || !user?.email) {
          throw new Error(safeT('checkout.error.incompleteUserData'))
        }

        // Create an AbortController with a timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
        
        try {
          const res = await fetch('/api/pagarme/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              user_id: user.id,
              email: user.email,
              name: userData.name || user.email?.split('@')[0] || 'User',
              plan_id: planId,
              payment_method: 'credit_card',
              card: {
                holder_name: card.name,
                number: card.number.replace(/\s/g, ''),
                exp_month: parseInt(card.expiry.split('/')[0]),
                exp_year: parseInt('20' + card.expiry.split('/')[1]),
                cvv: card.cvv,
                cpf: card.cpf.replace(/\D/g, '')
              },
              billing_address: {
                street: userData.street,
                number: userData.number,
                complement: userData.complement,
                zip_code: userData.zip_code.replace(/\D/g, ''),
                neighborhood: userData.neighborhood,
                city: userData.city,
                state: userData.state,
                country: userData.country
              }
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!res.ok) {
            const errorData = await res.json()
            
            // Handle specific Pagar.me error codes
            if (errorData.code) {
              switch (errorData.code) {
                case 'card_declined':
                  throw new Error(safeT('checkout.error.cardDeclined'))
                case 'insufficient_funds':
                  throw new Error(safeT('checkout.error.insufficientFunds'))
                case 'expired_card':
                  throw new Error(safeT('checkout.error.expiredCard'))
                case 'invalid_card':
                  throw new Error(safeT('checkout.error.invalidCard'))
                case 'processing_error':
                  throw new Error(safeT('checkout.error.processingError'))
                default:
                  throw new Error(errorData.message || safeT('checkout.error.paymentFailed'))
              }
            }
            
            throw new Error(errorData.message || safeT('checkout.error.paymentFailed'))
          }

          const data = await res.json()
          
          // Validate response data
          if (!data.subscription_id) {
            throw new Error(safeT('checkout.error.invalidResponse'))
          }
          
          if (mounted) {
            setResult({ success: true, message: safeT('checkout.success') })
            toast.success(safeT('checkout.success'))
            onSuccess?.()
            setStep(step + 1)
          }
        } catch (err) {
          if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
            throw new Error(safeT('checkout.error.timeout'))
          }
          throw err
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : safeT('checkout.error.unknown')
          setResult({ success: false, message: errorMessage })
          toast.error(errorMessage)
          // Move to the result step even on error
          setStep(step + 1)
        }
      } finally {
        if (mounted) {
          setLoading(false)
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
        const cardValidation = {
          numberLength: card.number.length === 16,
          luhnCheck: luhnCheck(card.number),
          nameLength: card.name.length > 0,
          expiryLength: card.expiry.length === 5,
          expiryValid: validateExpiryDate(card.expiry),
          cvvLength: card.cvv.length >= 3,
          cpfLength: card.cpf.length === 11,
          cpfValid: validateCPF(card.cpf)
        };
        
        console.log('Card validation details:', cardValidation);
        
        return Object.values(cardValidation).every(Boolean);
      case 3:
        return true
      default:
        return false
    }
  }

  const calculateProgress = () => {
    const steps = {
      plan: planId ? 100 : 0,
      user: Object.values(userData).filter(Boolean).length / Object.keys(userData).length * 100,
      payment: Object.values(card).filter(Boolean).length / Object.keys(card).length * 100,
      confirm: 100,
      result: 100
    };
    
    return steps[STEPS[step]] || 0;
  };

  const handleError = async (error: any) => {
    // Log do erro
    console.error('Checkout error:', error);

    // Tentar recuperar automaticamente
    if (error.message.includes('network')) {
      toast.error(safeT('checkout.error.network'), {
        action: {
          label: safeT('checkout.retry'),
          onClick: handleNext
        }
      });
    } else if (error.message.includes('card_declined')) {
      toast.error(safeT('checkout.error.cardDeclined'), {
        action: {
          label: safeT('checkout.tryAnotherCard'),
          onClick: () => setStep(2)
        }
      });
    } else {
      // Erro não recuperável
      setResult({
        success: false,
        message: error.message
      });
      
      // Oferecer suporte
      toast.error(safeT('checkout.error.contactSupport'), {
        action: {
          label: safeT('checkout.contactSupport'),
          onClick: () => window.open('/support', '_blank')
        }
      });
    }
  };

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
      <div className="relative mb-12">
        <Progress 
          value={calculateProgress()} 
          className="h-3 bg-muted/50" 
        />
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs">
          {STEPS.map((stepKey, index) => (
            <div
              key={stepKey}
              className={cn(
                "flex flex-col items-center gap-2 transition-colors duration-200",
                index <= step 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground/70"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full transition-all duration-200",
                index < step 
                  ? "bg-primary scale-75 ring-2 ring-primary/30" 
                  : index === step 
                    ? "bg-primary scale-100 ring-4 ring-primary/30" 
                    : "bg-muted/50 ring-2 ring-border"
              )} />
              <span className="whitespace-nowrap">{stepTitles[stepKey]}</span>
            </div>
          ))}
        </div>
      </div>

      <div role="alert" aria-live="polite" className="sr-only">
        {safeT(`checkout.step${step + 1}Of${STEPS.length}`)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          {...pageTransition}
          className="space-y-6"
        >
          <Card className="shadow-xl border-2 border-border bg-card">
            <CardHeader className="pb-6 border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                  step === STEPS.length - 1 
                    ? (result.success 
                        ? "bg-green-500/20 text-green-500 ring-2 ring-green-500/20" 
                        : "bg-red-500/20 text-red-500 ring-2 ring-red-500/20")
                    : "bg-primary/20 text-primary ring-2 ring-primary/20"
                )}>
                  {stepIcons[STEPS[step]]}
                </div>
                <span className="font-semibold">{stepTitles[STEPS[step]]}</span>
              </CardTitle>
              {step > 0 && step < 4 && (
                <div className="text-sm flex items-center gap-2 mt-3 p-2 rounded-md bg-muted/30">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{safeT('checkout.plan')}:</span>
                  <span className="font-medium text-foreground">{planId && PLANS[planId].name}</span>
                  <span className="text-primary font-semibold">{planId && formatCurrency(PLANS[planId].price, locale)}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto px-6 py-6">
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
                        "w-full justify-between p-6 h-auto relative group transition-all duration-200",
                        planId === id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:border-primary/50 hover:bg-primary/5",
                        "border-2"
                      )}
                      onClick={() => setPlanId(id as PlanId)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-lg">{plan.name}</span>
                        <span className={cn(
                          "text-sm",
                          planId === id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>{plan.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "text-2xl font-bold",
                          planId === id ? "text-primary-foreground" : "text-foreground"
                        )}>{formatCurrency(plan.price, locale)}</span>
                        <span className={cn(
                          "text-sm",
                          planId === id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>{safeT('checkout.perMonth')}</span>
                      </div>
                      {planId === id && (
                        <motion.div
                          layoutId="plan-selection"
                          className="absolute inset-0 border-2 border-primary rounded-md"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
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
                    <Label htmlFor="user-zip">{safeT('checkout.zip')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="user-zip"
                        placeholder={safeT('checkout.zipPlaceholder')}
                        value={userData.zip_code}
                        onChange={async (e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setUserData({ ...userData, zip_code: value });
                          
                          if (value.length === 8) {
                            try {
                              const address = await fetchAddressByCEP(value);
                              setUserData(prev => ({
                                ...prev,
                                street: address.street || prev.street,
                                neighborhood: address.neighborhood || prev.neighborhood,
                                city: address.city || prev.city,
                                state: address.state || prev.state,
                                complement: address.complement || prev.complement,
                              }));
                              toast.success(safeT('checkout.addressFound'));
                            } catch (error) {
                              toast.error(safeT('checkout.error.invalidZip'));
                            }
                          }
                        }}
                        maxLength={8}
                        className={cn('text-foreground bg-background', userData.zip_code.length > 0 && userData.zip_code.length < 8 && 'border-red-500')}
                      />
                    </div>
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
                      {safeT('checkout.plan')}: <b>{planId && PLANS[planId].name}</b> — {planId && formatCurrency(PLANS[planId].price, locale)}
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
            <div className="flex justify-between p-6 border-t border-border bg-muted/5">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || step === 4}
                className={cn(
                  "gap-2 border-2",
                  step === 0 || step === 4 ? "" : "hover:bg-primary/5 hover:border-primary/50"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                {safeT('checkout.back')}
              </Button>
              {step < 3 && (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || loading}
                  className={cn(
                    "gap-2 relative overflow-hidden",
                    isStepValid() && !loading ? "hover:opacity-90 transition-opacity" : ""
                  )}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {safeT('checkout.next')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                  {isStepValid() && !loading && (
                    <motion.div
                      className="absolute inset-0 bg-primary/10"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-500/20"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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

