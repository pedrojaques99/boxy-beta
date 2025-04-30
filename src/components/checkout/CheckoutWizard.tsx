/*
  CheckoutWizard.tsx
  - 3 etapas: Plano > Cartão > Confirmação
  - Estilo integrado com shadcn/ui e globals.css do Boxy
*/

'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslations } from '@/hooks/use-translations'
import { Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

const PLANS = [
  { id: 'pln_mensal_id', label: 'Mensal', price: 'R$ 37,90/mês' },
  { id: 'pln_anual_id', label: 'Anual', price: 'R$ 379,00/ano' },
]

const STEPS = [
  { id: 'plano', label: 'Plano' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'confirmacao', label: 'Confirmação' },
]

export function CheckoutWizard({ defaultPlanId }: { defaultPlanId?: string }) {
  const user = useUser()
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState(defaultPlanId || '')
  const [cardData, setCardData] = useState({
    holder_name: '',
    number: '',
    exp_month: '',
    exp_year: '',
    cvv: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para assinar.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pagarme/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          plan_id: planId,
          payment_method: 'credit_card',
          card: cardData
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento')
      }

      setSuccess(true)
      toast.success('Assinatura criada com sucesso!')
    } catch (err: any) {
      console.error('Subscription error:', err)
      setSuccess(false)
      toast.error(err.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
      setStep(2)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Assinatura Boxy</h1>
        <p className="text-muted-foreground">Escolha seu plano e complete o pagamento</p>
      </div>

      <Tabs value={STEPS[step].id} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {STEPS.map((s, index) => (
            <TabsTrigger
              key={s.id}
              value={s.id}
              disabled={index > step}
              className={cn(
                "relative",
                index <= step && "text-primary",
                index === step && "bg-primary/10"
              )}
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STEPS.map((s, index) => (
          <TabsContent key={s.id} value={s.id}>
            <AnimatePresence mode="wait">
              {step === index && (
                <motion.div
                  key={`step-${index}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {index === 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PLANS.map((plan) => (
                          <Card
                            key={plan.id}
                            className={cn(
                              "cursor-pointer p-6 transition-all duration-200 relative overflow-hidden",
                              "hover:border-accent/50 hover:shadow-lg",
                              planId === plan.id
                                ? "border-accent bg-accent/5 shadow-md"
                                : "border-border hover:bg-muted/50"
                            )}
                            onClick={() => setPlanId(plan.id)}
                          >
                            {planId === plan.id && (
                              <div className="absolute top-2 right-2 text-accent">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{plan.label}</h3>
                              <p className="text-muted-foreground">{plan.price}</p>
                              {plan.id === 'pln_anual_id' && (
                                <p className="text-sm text-primary font-medium">
                                  Economize 20% com o plano anual
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                        <Button disabled={!planId} onClick={() => setStep(1)}>
                          Continuar
                        </Button>
                      </div>
                    </>
                  )}

                  {index === 1 && (
                    <>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="holder_name">Nome no cartão</Label>
                          <Input
                            id="holder_name"
                            value={cardData.holder_name}
                            onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
                            className="text-foreground dark:text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="number">Número do cartão</Label>
                          <Input
                            id="number"
                            value={cardData.number}
                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                            className="text-foreground dark:text-foreground"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="exp_month">Mês</Label>
                            <Input
                              id="exp_month"
                              value={cardData.exp_month}
                              onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value })}
                              className="text-foreground dark:text-foreground"
                            />
                          </div>
                          <div>
                            <Label htmlFor="exp_year">Ano</Label>
                            <Input
                              id="exp_year"
                              value={cardData.exp_year}
                              onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value })}
                              className="text-foreground dark:text-foreground"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            className="text-foreground dark:text-foreground"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                        <Button onClick={handleSubscribe} disabled={loading}>
                          {loading ? 'Processando...' : 'Assinar agora'}
                        </Button>
                      </div>
                    </>
                  )}

                  {index === 2 && (
                    <div className="text-center py-8">
                      {success === true && (
                        <>
                          <h2 className="text-xl font-bold mb-2">Assinatura confirmada ✅</h2>
                          <p className="text-muted-foreground">Você já pode aproveitar todos os recursos premium.</p>
                        </>
                      )}
                      {success === false && (
                        <>
                          <h2 className="text-xl font-bold mb-2 text-destructive">Erro no pagamento ❌</h2>
                          <p className="text-muted-foreground">Por favor, tente novamente ou entre em contato com o suporte.</p>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
