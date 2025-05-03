/*
  CheckoutWizard.tsx
  - 3 etapas: Plano > Cartão > Confirmação
  - Estilo integrado com shadcn/ui e globals.css do Boxy
*/

'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/hooks/use-translations'
import { Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PlanId, PLANS } from '@/lib/plans'
import { handleError } from '@/lib/error-handler'

const STEPS = ['plan', 'payment', 'confirm']

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
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: ''
  })
  const [billing, setBilling] = useState({
    street: '',
    number: '',
    complement: '',
    zip_code: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'BR'
  })
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (user !== null) {
      setAuthLoading(false)
    }
  }, [user])

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleNext = async () => {
    if (step === STEPS.length - 1) {
      setLoading(true)
      try {
        if (!user) {
          console.error('User state:', user)
          throw new Error('User not authenticated. Please try logging in again.')
        }

        if (!user.id || !user.email) {
          console.error('User data incomplete:', { id: user.id, email: user.email })
          throw new Error('User data incomplete. Please try logging in again.')
        }

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
            billing_address: billing
          })
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('Payment error response:', {
            status: res.status,
            statusText: res.statusText,
            data: data
          })
          throw new Error(data.error || data.message || 'Failed to process payment')
        }

        toast.success('Subscription created successfully!')
        onSuccess?.()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        console.error('Payment error details:', {
          error: err,
          message: errorMessage,
          planId,
          user: user ? {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
          } : null,
          card: {
            ...card,
            number: card.number.replace(/\d(?=\d{4})/g, '*'),
            cvv: '***'
          },
          billing: billing
        })
        toast.error(errorMessage)
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
          card.number.length >= 16 &&
          card.name.length > 0 &&
          card.expiry.length === 5 &&
          card.cvv.length >= 3 &&
          card.cpf.length === 11 &&
          billing.street.length > 0 &&
          billing.number.length > 0 &&
          billing.zip_code.length === 8 &&
          billing.neighborhood.length > 0 &&
          billing.city.length > 0 &&
          billing.state.length === 2
        )
      case 2:
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

  if (!user) {
    return (
      <div className="space-y-4 p-8 text-center">
        <h3 className="text-lg font-semibold">Authentication Required</h3>
        <p>Please log in to continue with your subscription.</p>
        <Button onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Tabs value={STEPS[step]} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {STEPS.map((s, i) => (
            <TabsTrigger
              key={s}
              value={s}
              disabled={i > step}
              className={cn(
                'relative',
                i === step && 'text-primary',
                i < step && 'text-green-500'
              )}
            >
              {i < step ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-current" />
              )}
              <span className="ml-2 capitalize">{s}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.checkout?.selectPlan || 'Select a Plan'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(PLANS).map(([id, plan]) => (
                <Button
                  key={id}
                  variant={planId === id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setPlanId(id as PlanId)}
                >
                  {plan.name} - {plan.price}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.checkout?.paymentDetails || 'Payment Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">{t?.checkout?.cardNumber || 'Card Number'}</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                  maxLength={16}
                  className="text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-name">{t?.checkout?.cardName || 'Cardholder Name'}</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                  className="text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cpf">CPF</Label>
                <Input
                  id="card-cpf"
                  placeholder="00000000000"
                  value={card.cpf}
                  onChange={e => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                  maxLength={11}
                  className="text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-expiry">{t?.checkout?.expiryDate || 'Expiry Date'}</Label>
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
                    className="text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-cvv">{t?.checkout?.cvv || 'CVV'}</Label>
                  <Input
                    id="card-cvv"
                    placeholder="123"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                    maxLength={4}
                    className="text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-street">Rua</Label>
                <Input id="billing-street" value={billing.street} onChange={e => setBilling({ ...billing, street: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-number">Número</Label>
                <Input id="billing-number" value={billing.number} onChange={e => setBilling({ ...billing, number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-complement">Complemento</Label>
                <Input id="billing-complement" value={billing.complement} onChange={e => setBilling({ ...billing, complement: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-zip">CEP</Label>
                <Input id="billing-zip" value={billing.zip_code} onChange={e => setBilling({ ...billing, zip_code: e.target.value.replace(/\D/g, '') })} maxLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-neighborhood">Bairro</Label>
                <Input id="billing-neighborhood" value={billing.neighborhood} onChange={e => setBilling({ ...billing, neighborhood: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-city">Cidade</Label>
                <Input id="billing-city" value={billing.city} onChange={e => setBilling({ ...billing, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-state">Estado</Label>
                <Input id="billing-state" value={billing.state} onChange={e => setBilling({ ...billing, state: e.target.value })} maxLength={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirm" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.checkout?.confirm || 'Confirm Subscription'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t?.checkout?.plan || 'Plan'}: {planId && PLANS[planId].name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t?.checkout?.price || 'Price'}: {planId && PLANS[planId].price}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t?.checkout?.back || 'Back'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isStepValid() || loading}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : step === STEPS.length - 1 ? (
            t?.checkout?.confirm || 'Confirm'
          ) : (
            t?.checkout?.next || 'Next'
          )}
        </Button>
      </div>
    </div>
  )
}
