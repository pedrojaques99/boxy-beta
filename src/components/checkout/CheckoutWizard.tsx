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
    <div className="max-w-md mx-auto my-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>
                {step === 0 && (t?.checkout?.selectPlan || 'Escolha seu plano')}
                {step === 1 && (t?.checkout?.paymentDetails || 'Dados de pagamento')}
                {step === 2 && (t?.checkout?.confirm || 'Confirmação')}
              </CardTitle>
              {step > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Plano: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && (
                <div className="space-y-4">
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
                </div>
              )}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="card-number">{t?.checkout?.cardNumber || 'Card Number'}</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                      maxLength={16}
                      className={cn(
                        "text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground",
                        card.number.length > 0 && card.number.length < 16 && 'border-red-500'
                      )}
                    />
                    {card.number.length > 0 && card.number.length < 16 && (
                      <span className="text-xs text-red-500">Número de cartão inválido</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">{t?.checkout?.cardName || 'Cardholder Name'}</Label>
                    <Input
                      id="card-name"
                      placeholder="John Doe"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      className={cn(
                        "text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground",
                        card.name.length === 0 && 'border-red-500'
                      )}
                    />
                    {card.name.length === 0 && (
                      <span className="text-xs text-red-500">Nome obrigatório</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cpf">CPF</Label>
                    <Input
                      id="card-cpf"
                      placeholder="00000000000"
                      value={card.cpf}
                      onChange={e => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                      maxLength={11}
                      className={cn(
                        "text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground",
                        card.cpf.length > 0 && card.cpf.length < 11 && 'border-red-500'
                      )}
                    />
                    {card.cpf.length > 0 && card.cpf.length < 11 && (
                      <span className="text-xs text-red-500">CPF inválido</span>
                    )}
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
                        className={cn(
                          "text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground",
                          card.expiry.length > 0 && card.expiry.length < 5 && 'border-red-500'
                        )}
                      />
                      {card.expiry.length > 0 && card.expiry.length < 5 && (
                        <span className="text-xs text-red-500">Data inválida</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">{t?.checkout?.cvv || 'CVV'}</Label>
                      <Input
                        id="card-cvv"
                        placeholder="123"
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                        maxLength={4}
                        className={cn(
                          "text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground",
                          card.cvv.length > 0 && card.cvv.length < 3 && 'border-red-500'
                        )}
                      />
                      {card.cvv.length > 0 && card.cvv.length < 3 && (
                        <span className="text-xs text-red-500">CVV inválido</span>
                      )}
                    </div>
                  </div>
                  {/* Endereço de cobrança */}
                  <div className="space-y-2">
                    <Label htmlFor="billing-street">Rua</Label>
                    <Input id="billing-street" value={billing.street} onChange={e => setBilling({ ...billing, street: e.target.value })} className={cn(billing.street.length === 0 && 'border-red-500')} />
                    {billing.street.length === 0 && <span className="text-xs text-red-500">Rua obrigatória</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-number">Número</Label>
                    <Input id="billing-number" value={billing.number} onChange={e => setBilling({ ...billing, number: e.target.value })} className={cn(billing.number.length === 0 && 'border-red-500')} />
                    {billing.number.length === 0 && <span className="text-xs text-red-500">Número obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-complement">Complemento</Label>
                    <Input id="billing-complement" value={billing.complement} onChange={e => setBilling({ ...billing, complement: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-zip">CEP</Label>
                    <Input id="billing-zip" value={billing.zip_code} onChange={e => setBilling({ ...billing, zip_code: e.target.value.replace(/\D/g, '') })} maxLength={8} className={cn(billing.zip_code.length > 0 && billing.zip_code.length < 8 && 'border-red-500')} />
                    {billing.zip_code.length > 0 && billing.zip_code.length < 8 && <span className="text-xs text-red-500">CEP inválido</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-neighborhood">Bairro</Label>
                    <Input id="billing-neighborhood" value={billing.neighborhood} onChange={e => setBilling({ ...billing, neighborhood: e.target.value })} className={cn(billing.neighborhood.length === 0 && 'border-red-500')} />
                    {billing.neighborhood.length === 0 && <span className="text-xs text-red-500">Bairro obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">Cidade</Label>
                    <Input id="billing-city" value={billing.city} onChange={e => setBilling({ ...billing, city: e.target.value })} className={cn(billing.city.length === 0 && 'border-red-500')} />
                    {billing.city.length === 0 && <span className="text-xs text-red-500">Cidade obrigatória</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-state">Estado</Label>
                    <Input id="billing-state" value={billing.state} onChange={e => setBilling({ ...billing, state: e.target.value })} maxLength={2} className={cn(billing.state.length > 0 && billing.state.length < 2 && 'border-red-500')} />
                    {billing.state.length > 0 && billing.state.length < 2 && <span className="text-xs text-red-500">Estado inválido</span>}
                  </div>
                </>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                    <div className="text-lg font-semibold mb-2">Confirme sua assinatura</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Plano: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div><b>Nome:</b> {card.name}</div>
                    <div><b>CPF:</b> {card.cpf}</div>
                    <div><b>Rua:</b> {billing.street}, {billing.number} {billing.complement && `- ${billing.complement}`}</div>
                    <div><b>Bairro:</b> {billing.neighborhood}</div>
                    <div><b>Cidade:</b> {billing.city} - {billing.state}</div>
                    <div><b>CEP:</b> {billing.zip_code}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="flex justify-between mt-6 px-6 pb-6">
              <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t?.checkout?.back || 'Voltar'}
              </Button>
              <Button onClick={handleNext} disabled={!isStepValid() || loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : step === STEPS.length - 1 ? (
                  t?.checkout?.confirm || 'Confirmar'
                ) : (
                  t?.checkout?.next || 'Próximo'
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
