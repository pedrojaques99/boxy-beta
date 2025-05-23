'use client'

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
import { useAuth } from '@/hooks/use-auth'
import visaIcon from '@/assets/cards/visa.svg';
import mastercardIcon from '@/assets/cards/mastercard.svg';
import defaultCardIcon from '@/assets/cards/card.svg';


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
  phone?: string
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

interface SubscriptionResult {
  id: string;
  status: string;
  plan_id: string;
  payment_method: string;
  current_period?: { start_at?: number; end_at?: number };
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

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Cartão de Crédito' }
];

// Função para formatar número do cartão com espaço a cada 4 dígitos
function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

// Função para detectar bandeira do cartão
function getCardBrand(number: string) {
  const n = number.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  return 'default';
}

export function CheckoutWizard({ defaultPlanId, onSuccess }: CheckoutWizardProps) {
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
  const [result, setResult] = useState<{ success: boolean, message: string, subscription?: SubscriptionResult }>({ success: false, message: '' })
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const authService = getAuthService()
  const { user, loading: userLoading } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<'credit_card'>('credit_card')
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'default'>('default');

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
  
  // Handles successful subscription completion
  const handleSuccessfulSubscription = (subscriptionData: {
    subscription: { id: string }
  }) => {
    // Save subscription data to local storage for reference
    try {
      localStorage.setItem('subscription_success', JSON.stringify({
        timestamp: Date.now(),
        plan: planId,
        subscription_id: subscriptionData.subscription.id
      }));
    } catch (e) {
      console.error('Failed to save subscription data to local storage:', e);
    }
    
    // Update UI
    setResult({ 
      success: true, 
      message: safeT('checkout.success'),
      subscription: subscriptionData.subscription as SubscriptionResult
    });
    
    // Show success toast
    toast.success(safeT('checkout.success'), {
      duration: 5000,
      action: {
        label: safeT('profile.viewSubscription'),
        onClick: () => router.push('/profile/subscription')
      }
    });
    
    // Call success callback if provided
    onSuccess?.();
    
    // Move to next step
    setStep(step + 1);
  };

  // Populate user data when available
  useEffect(() => {
    const getUserProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await authService.getUserProfile(user.id)
        if (error) return

        if (data) {
          setUserData(prev => ({
            ...prev,
            name: data.name || user?.user_metadata?.full_name || '',
            email: user?.email || '',
          }))
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
      }
    }

    if (user) {
      getUserProfile()
    }
  }, [user, authService])

  // Auth state effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await authService.getSession()
        
        if (error) {
          setAuthLoading(false)
          return
        }
        
        if (session) {
          setAuthLoading(false)
        } else {
          setAuthLoading(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthLoading(false)
      }
    }

    checkAuth()
    
    if (user !== null) {
      setAuthLoading(false)
    }
  }, [user, authService])

  // Save progress
  useEffect(() => {
    if (step > 0) {
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

    return () => {
      if (step < STEPS.length - 1) {
        localStorage.removeItem('checkout_progress')
      }
    }
  }, [step, userData, planId])

  // Restore progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('checkout_progress')
    if (savedProgress) {
      const { step: savedStep, userData: savedUserData, planId: savedPlanId, timestamp } = JSON.parse(savedProgress)
      
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setStep(savedStep)
        setUserData(savedUserData)
        setPlanId(savedPlanId)
        toast.info(safeT('checkout.progressRestored'))
      } else {
        localStorage.removeItem('checkout_progress')
      }
    }
  }, [safeT])

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleNext = async () => {
    // --- INÍCIO: Checagens e logs solicitados ---
    if (authLoading || userLoading) {
      console.log('Ainda carregando auth...');
      return;
    }
    // Vamos buscar o sessionData para checar o token antes de seguir
    let sessionData;
    try {
      const sessionResp = await authService.getSession();
      sessionData = sessionResp?.data;
      console.log('Session Data:', sessionData);
      console.log('User:', user);
      console.log('Token:', sessionData?.session?.access_token);
    } catch (e) {
      console.log('Erro ao buscar sessão:', e);
      return;
    }
    if (!sessionData?.session?.access_token) {
      console.log('Sem token!');
      return;
    }
    if (!user?.id) {
      console.log('Sem user ID!');
      return;
    }
    // --- FIM: Checagens e logs solicitados ---

    if (step === STEPS.length - 1) {
      setLoading(true)
      try {
        // Get session with a single call and proper error handling
        const { data: sessionData, error: sessionError } = await authService.getSession();
        console.log('Session Data:', sessionData);
        console.log('Session Error:', sessionError);
        if (!sessionData?.session) {
          toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          return;
        }
        const token = sessionData.session.access_token;
        console.log('Token sent to API:', token);

        // Continue with user validation
        if (!user?.id || !user?.email) {
          throw new Error(safeT('checkout.error.incompleteUserData'));
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // FIX: Build payload with required root fields for backend
        const v5Payload = {
          user_id: user.id,
          email: userData.email,
          name: userData.name,
          plan_id: planId,
          payment_method: 'credit_card',
          card: {
            holder_name: card.name,
            number: card.number,
            exp_month: card.expiry.split('/')[0],
            exp_year: '20' + card.expiry.split('/')[1],
            cvv: card.cvv,
            cpf: card.cpf
          },
          billing_address: {
            street: userData.street,
            number: userData.number,
            complement: userData.complement,
            zip_code: userData.zip_code,
            city: userData.city,
            state: userData.state,
            country: userData.country
          },
          discounts: [
            { cycles: 3, value: 10, discount_type: 'percentage' }
          ],
          increments: [
            { cycles: 2, value: 20, increment_type: 'percentage' }
          ],
          metadata: {
            supabase_user_id: user.id,
            plan_id: planId
          },
          customer: {
            name: userData.name,
            email: userData.email,
            document: card.cpf,
            document_type: 'cpf',
            type: 'individual',
            phones: {
              mobile_phone: {
                country_code: '55',
                area_code: userData.phone?.substring(0, 2) || '11',
                number: userData.phone?.substring(2) || '999999999'
              }
            }
          }
        };

        // Final validation before API call
        if (
          !v5Payload.user_id ||
          !v5Payload.email ||
          !v5Payload.name ||
          !v5Payload.plan_id ||
          !v5Payload.payment_method ||
          !v5Payload.card.holder_name ||
          !v5Payload.card.number ||
          !v5Payload.card.exp_month ||
          !v5Payload.card.exp_year ||
          !v5Payload.card.cvv ||
          !v5Payload.card.cpf ||
          !v5Payload.billing_address.street ||
          !v5Payload.billing_address.number ||
          !v5Payload.billing_address.zip_code ||
          !v5Payload.billing_address.city ||
          !v5Payload.billing_address.state ||
          !v5Payload.billing_address.country
        ) {
          throw new Error(safeT('checkout.error.invalidPayload'));
        }

        // Enviar método de pagamento selecionado
        const res = await fetch('/api/pagarme/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(v5Payload),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const errorData = await res.json()
          
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

        const responseData = await res.json()
        
        // Validate response contains subscription data
        if (!responseData.subscription || !responseData.subscription.id) {
          console.error('Invalid API response:', responseData);
          throw new Error(safeT('checkout.error.invalidResponse'));
        }
        
        // Handle success - mostrar detalhes do pagamento
        handleSuccessfulSubscription({
          subscription: responseData.subscription
        });
      } catch (err) {
        // Handle request timeout
        if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AbortError') {
          console.error('Request timed out:', err);
          setResult({ 
            success: false, 
            message: safeT('checkout.error.timeout')
          });
          toast.error(safeT('checkout.error.timeout'));
          setStep(step + 1);
          setLoading(false);
          return;
        }

        let errorMessage = err instanceof Error ? err.message : safeT('checkout.error.unknown')
        let showLoginButton = false
        
        if (errorMessage === 'SESSION_EXPIRED') {
          errorMessage = safeT('checkout.error.sessionExpired')
          showLoginButton = true
        }
        
        setResult({ success: false, message: errorMessage })
        toast.error(errorMessage)
        setStep(step + 1)
        
        if (showLoginButton) {
          setTimeout(() => {
            const btn = document.createElement('button')
            btn.innerText = safeT('checkout.login')
            btn.className = 'mt-4 px-4 py-2 rounded bg-primary text-primary-foreground font-medium'
            btn.onclick = () => {
              window.location.href = `/auth/login?redirect=/checkout`
            }
            const errorDiv = document.querySelector('.checkout-error-actions')
            if (errorDiv) errorDiv.appendChild(btn)
          }, 100)
        }
      } finally {
        setLoading(false)
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
        // Validação sem Luhn: apenas checar se tem 16 dígitos
        const numberValid = card.number.replace(/\s/g, '').length === 16;
        const expiryValid = card.expiry.length === 5 && validateExpiryDate(card.expiry);
        const cvvValid = card.cvv.length >= 3;
        const cpfValid = card.cpf.replace(/\D/g, '').length === 11 && validateCPF(card.cpf);
        const nameValid = card.name.trim().length >= 3;

        // Log validation issues for debugging
        if (!numberValid || !expiryValid || !cvvValid || !cpfValid || !nameValid) {
          console.log('Card validation failed:', {
            numberValid,
            expiryValid,
            cvvValid,
            cpfValid,
            nameValid
          });
        }
        
        return numberValid && expiryValid && cvvValid && cpfValid && nameValid;
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

  if (authLoading || userLoading) {
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
    <div className="w-full max-w-md sm:max-w-2xl mx-auto my-6 sm:my-12 px-2 sm:px-4 md:px-6">
      <div className="relative mb-8 sm:mb-12">
        <Progress 
          value={calculateProgress()} 
          className="h-2 sm:h-3 bg-muted/50" 
        />
        <div className="absolute -bottom-6 sm:-bottom-8 left-0 right-0 flex justify-between text-[10px] sm:text-xs">
          {STEPS.map((stepKey, index) => (
            <div
              key={stepKey}
              className={cn(
                "flex flex-col items-center gap-1 sm:gap-2 transition-colors duration-200",
                index <= step 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground/70"
              )}
            >
              <div className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200",
                index < step 
                  ? "bg-primary scale-75 ring-2 ring-primary/30" 
                  : index === step 
                    ? "bg-primary scale-100 ring-4 ring-primary/30" 
                    : "bg-muted/50 ring-2 ring-border"
              )} />
              <span className="whitespace-nowrap hidden xs:inline-block">{stepTitles[stepKey]}</span>
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
          className="space-y-4 sm:space-y-6"
        >
          <Card className="shadow-xl border-2 border-border bg-card w-full rounded-lg">
            <CardHeader className="pb-4 sm:pb-6 border-b border-border">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                  step === STEPS.length - 1 
                    ? (result.success 
                        ? "bg-green-500/20 text-green-500 ring-2 ring-green-500/20" 
                        : "bg-red-500/20 text-red-500 ring-2 ring-red-500/20")
                    : "bg-primary/20 text-primary ring-2 ring-primary/20"
                )}>
                  {stepIcons[STEPS[step]]}
                </div>
                <span className="font-semibold hidden xs:inline-block">{stepTitles[STEPS[step]]}</span>
              </CardTitle>
              {step > 0 && step < 4 && (
                <div className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 p-1 sm:p-2 rounded-md bg-muted/30">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{safeT('checkout.plan')}:</span>
                  <span className="font-medium text-foreground">{planId && PLANS[planId].name}</span>
                  <span className="text-primary font-semibold">{planId && formatCurrency(PLANS[planId].price, locale)}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto px-2 sm:px-6 py-4 sm:py-6">
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 sm:space-y-4"
                >
                  {Object.entries(PLANS).map(([id, plan]) => (
                    <Button
                      key={id}
                      variant={planId === id ? 'default' : 'outline'}
                      className={cn(
                        "w-full justify-between p-4 sm:p-6 h-auto relative group transition-all duration-200",
                        planId === id 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:border-primary/50 hover:bg-primary/5",
                        "border-2"
                      )}
                      onClick={() => setPlanId(id as PlanId)}
                    >
                      <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                        <span className="font-semibold text-base sm:text-lg">{plan.name}</span>
                        <span className={cn(
                          "text-xs sm:text-sm",
                          planId === id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>{plan.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                        <span className={cn(
                          "text-xl sm:text-2xl font-bold",
                          planId === id ? "text-primary-foreground" : "text-foreground"
                        )}>{formatCurrency(plan.price, locale)}</span>
                        <span className={cn(
                          "text-xs sm:text-sm",
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
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6"
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
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6"
                >
                  <div className="space-y-2 col-span-2">
                    <Label>Método de Pagamento</Label>
                    <div className="flex gap-2">
                      <Button
                        key="credit_card"
                        variant="default"
                        className="flex-1"
                        disabled
                      >
                        Cartão de Crédito
                      </Button>
                    </div>
                  </div>
                  {/* Campos de cartão de crédito sempre visíveis */}
                  <div className="space-y-2">
                    <Label htmlFor="card-number">{safeT('checkout.cardNumber')}</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        autoCapitalize="off"
                        autoCorrect="off"
                        maxLength={19}
                        value={card.number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCard({ ...card, number: formatted });
                          setCardBrand(getCardBrand(formatted));
                        }}
                        className={cn('text-foreground bg-background pr-10', card.number.length > 0 && card.number.length < 19 && 'border-red-500')}
                        placeholder="1234 5678 9012 3456"
                      />
                      <span className="absolute right-2">
                        {cardBrand === 'visa' && <img src={visaIcon} alt="Visa" className="h-6 w-8" />}
                        {cardBrand === 'mastercard' && <img src={mastercardIcon} alt="Mastercard" className="h-6 w-8" />}
                        {cardBrand === 'default' && <img src={defaultCardIcon} alt="Card" className="h-6 w-8" />}
                      </span>
                    </div>
                    {card.number.length > 0 && card.number.replace(/\D/g, '').length < 16 && <span className="text-xs text-red-500">{safeT('checkout.error.invalidCardNumber')}</span>}
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
                      {result.subscription && (
                        <div className="mt-4 text-left text-xs bg-muted/30 p-3 rounded">
                          <div><b>ID Assinatura:</b> {result.subscription.id}</div>
                          <div><b>Status:</b> {result.subscription.status}</div>
                          <div><b>Método:</b> {result.subscription.payment_method}</div>
                          <div><b>Plano:</b> {result.subscription.plan_id}</div>
                          <div><b>Início:</b> {result.subscription.current_period?.start_at && new Date(result.subscription.current_period.start_at * 1000).toLocaleString()}</div>
                          <div><b>Fim:</b> {result.subscription.current_period?.end_at && new Date(result.subscription.current_period.end_at * 1000).toLocaleString()}</div>
                        </div>
                      )}
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between p-4 sm:p-6 border-t border-border bg-muted/5">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || step === 4}
                className={cn(
                  "gap-2 border-2 w-full sm:w-auto",
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
                    "gap-2 relative overflow-hidden w-full sm:w-auto",
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
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-500/20 w-full sm:w-auto"
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
              {step === 4 && !result.success && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem('checkout_progress');
                    window.location.reload();
                  }}
                  className="gap-2 border-2 w-full sm:w-auto"
                >
                  Resetar Checkout
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

