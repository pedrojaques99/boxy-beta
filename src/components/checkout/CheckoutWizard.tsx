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
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'


const PLANS = [
  { id: 'pln_mensal_id', label: 'Mensal', price: 'R$ 37,90/mês' },
  { id: 'pln_anual_id', label: 'Anual', price: 'R$ 379,00/ano' },
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

  const handleSubscribe = async () => {
    if (!user) return alert('Você precisa estar logado.')
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
      if (data.error) throw new Error(data.error)
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setSuccess(false)
    } finally {
      setLoading(false)
      setStep(2)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold mb-4">Escolha seu plano</h2>
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
            <Button disabled={!planId} onClick={() => setStep(1)}>
              Continuar
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold mb-4">Dados do Cartão</h2>
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
            <Button className="w-full" onClick={handleSubscribe} disabled={loading}>
              {loading ? 'Processando...' : 'Assinar agora'}
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center py-8"
          >
            {success === true && (
              <>
                <h2 className="text-xl font-bold mb-2">Assinatura confirmada ✅</h2>
                <p className="text-muted-foreground">Você já pode aproveitar todos os recursos premium.</p>
              </>
            )}
            {success === false && (
              <>
                <h2 className="text-xl font-bold text-destructive mb-2">Erro ao assinar ❌</h2>
                <p className="text-muted-foreground">Tente novamente ou entre em contato com o suporte.</p>
              </>
            )}
            <Button onClick={() => setStep(0)} className="mt-6">
              {success ? 'Escolher outro plano' : 'Tentar novamente'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
