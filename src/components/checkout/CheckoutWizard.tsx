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

const STEPS = ['plan', 'user', 'payment', 'confirm', 'result']

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
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
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
          billing: userData
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
                {step === 0 && 'Escolha seu plano'}
                {step === 1 && 'Dados do usuário'}
                {step === 2 && 'Dados de pagamento'}
                {step === 3 && 'Confirmação'}
                {step === 4 && (result.success ? 'Sucesso' : 'Erro')}
              </CardTitle>
              {step > 0 && step < 4 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Plano: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nome completo</Label>
                    <Input
                      id="user-name"
                      placeholder="Seu nome"
                      value={userData.name}
                      onChange={e => setUserData({ ...userData, name: e.target.value })}
                      className={cn(userData.name.length === 0 && 'border-red-500')}
                    />
                    {userData.name.length === 0 && <span className="text-xs text-red-500">Nome obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">E-mail</Label>
                    <Input
                      id="user-email"
                      placeholder="seu@email.com"
                      value={userData.email}
                      onChange={e => setUserData({ ...userData, email: e.target.value })}
                      className={cn(userData.email.length === 0 && 'border-red-500')}
                    />
                    {userData.email.length === 0 && <span className="text-xs text-red-500">E-mail obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-street">Rua</Label>
                    <Input id="user-street" value={userData.street} onChange={e => setUserData({ ...userData, street: e.target.value })} className={cn(userData.street.length === 0 && 'border-red-500')} />
                    {userData.street.length === 0 && <span className="text-xs text-red-500">Rua obrigatória</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-number">Número</Label>
                    <Input id="user-number" value={userData.number} onChange={e => setUserData({ ...userData, number: e.target.value })} className={cn(userData.number.length === 0 && 'border-red-500')} />
                    {userData.number.length === 0 && <span className="text-xs text-red-500">Número obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-complement">Complemento</Label>
                    <Input id="user-complement" value={userData.complement} onChange={e => setUserData({ ...userData, complement: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-zip">CEP</Label>
                    <Input id="user-zip" value={userData.zip_code} onChange={e => setUserData({ ...userData, zip_code: e.target.value.replace(/\D/g, '') })} maxLength={8} className={cn(userData.zip_code.length > 0 && userData.zip_code.length < 8 && 'border-red-500')} />
                    {userData.zip_code.length > 0 && userData.zip_code.length < 8 && <span className="text-xs text-red-500">CEP inválido</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-neighborhood">Bairro</Label>
                    <Input id="user-neighborhood" value={userData.neighborhood} onChange={e => setUserData({ ...userData, neighborhood: e.target.value })} className={cn(userData.neighborhood.length === 0 && 'border-red-500')} />
                    {userData.neighborhood.length === 0 && <span className="text-xs text-red-500">Bairro obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-city">Cidade</Label>
                    <Input id="user-city" value={userData.city} onChange={e => setUserData({ ...userData, city: e.target.value })} className={cn(userData.city.length === 0 && 'border-red-500')} />
                    {userData.city.length === 0 && <span className="text-xs text-red-500">Cidade obrigatória</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-state">Estado</Label>
                    <Input id="user-state" value={userData.state} onChange={e => setUserData({ ...userData, state: e.target.value })} maxLength={2} className={cn(userData.state.length > 0 && userData.state.length < 2 && 'border-red-500')} />
                    {userData.state.length > 0 && userData.state.length < 2 && <span className="text-xs text-red-500">Estado inválido</span>}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Número do cartão</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                      maxLength={16}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.number.length > 0 && card.number.length < 16 && 'border-red-500')}
                    />
                    {card.number.length > 0 && card.number.length < 16 && <span className="text-xs text-red-500">Número de cartão inválido</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Nome impresso no cartão</Label>
                    <Input
                      id="card-name"
                      placeholder="John Doe"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.name.length === 0 && 'border-red-500')}
                    />
                    {card.name.length === 0 && <span className="text-xs text-red-500">Nome obrigatório</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cpf">CPF do titular</Label>
                    <Input
                      id="card-cpf"
                      placeholder="00000000000"
                      value={card.cpf}
                      onChange={e => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                      maxLength={11}
                      className={cn("text-foreground bg-background placeholder:text-muted-foreground focus:text-foreground", card.cpf.length > 0 && card.cpf.length < 11 && 'border-red-500')}
                    />
                    {card.cpf.length > 0 && card.cpf.length < 11 && <span className="text-xs text-red-500">CPF inválido</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Validade</Label>
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
                    {card.expiry.length > 0 && card.expiry.length < 5 && <span className="text-xs text-red-500">Data inválida</span>}
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
                    {card.cvv.length > 0 && card.cvv.length < 3 && <span className="text-xs text-red-500">CVV inválido</span>}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                    <div className="text-lg font-semibold mb-2">Confirme seus dados</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Plano: <b>{planId && PLANS[planId].name}</b> — {planId && PLANS[planId].price}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div><b>Nome:</b> {userData.name}</div>
                    <div><b>Email:</b> {userData.email}</div>
                    <div><b>Rua:</b> {userData.street}, {userData.number} {userData.complement && `- ${userData.complement}`}</div>
                    <div><b>Bairro:</b> {userData.neighborhood}</div>
                    <div><b>Cidade:</b> {userData.city} - {userData.state}</div>
                    <div><b>CEP:</b> {userData.zip_code}</div>
                    <div><b>Cartão:</b> **** **** **** {card.number.slice(-4)}</div>
                    <div><b>CPF:</b> {card.cpf}</div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4 text-center">
                  {result.success ? (
                    <>
                      <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <div className="text-lg font-semibold mb-2">Assinatura criada com sucesso!</div>
                      <div className="text-muted-foreground">Bem-vindo ao plano {planId && PLANS[planId].name}.</div>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 text-2xl">Erro</span>
                      <div className="text-muted-foreground mt-2 break-words max-w-xs mx-auto">{result.message || 'Erro ao processar assinatura.'}</div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex justify-between mt-6 px-6 pb-6">
              <Button variant="outline" onClick={handleBack} disabled={step === 0 || step === 4}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {step < 3 && (
                <Button onClick={handleNext} disabled={!isStepValid() || loading}>
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : 'Próximo'}
                </Button>
              )}
              {step === 3 && (
                <Button onClick={async () => {
                  setLoading(true)
                  try {
                    const res = await fetch('/api/pagarme/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user.id,
                        email: userData.email,
                        name: userData.name,
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
                      })
                    })
                    let data = null
                    try {
                      data = await res.json()
                    } catch (err) {
                      data = { error: err instanceof Error ? err.message : 'Erro inesperado ao processar resposta.' }
                    }
                    if (!res.ok || !data.success) {
                      setResult({ success: false, message: data.error || data.message || 'Erro ao processar assinatura.' })
                      console.error('Erro ao assinar:', data)
                    } else {
                      setResult({ success: true, message: 'Assinatura criada com sucesso!' })
                    }
                    setStep(4)
                  } catch (err) {
                    setResult({ success: false, message: err instanceof Error ? err.message : 'Erro inesperado.' })
                    setStep(4)
                    console.error('Erro ao assinar:', err)
                  } finally {
                    setLoading(false)
                  }
                }} disabled={loading}>
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : 'Confirmar'}
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
