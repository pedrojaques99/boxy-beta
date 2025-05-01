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
import { useRouter } from 'next/navigation'
import { PLANS, PlanId } from '@/lib/plans'

const STEPS = [
  { id: 'plano', label: 'Plano' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'confirmacao', label: 'Confirmação' },
]

export function CheckoutWizard({ 
  defaultPlanId,
  onSuccess 
}: { 
  defaultPlanId?: PlanId
  onSuccess?: () => void 
}) {
  const user = useUser()
  const router = useRouter()
  const t = useTranslations('checkout')
  const [step, setStep] = useState(0)
  const [planId, setPlanId] = useState<PlanId | undefined>(defaultPlanId)
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  })
  const [loading, setLoading] = useState(false)

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleNext = async () => {
    if (step === 0 && !planId) {
      toast.error(t?.selectPlan || 'Please select a plan')
      return
    }

    if (step === 1) {
      setLoading(true)
      try {
        const response = await fetch('/api/pagarme/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            email: user?.email,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0],
            plan_id: planId,
            payment_method: 'credit_card',
            card: {
              holder_name: card.name,
              number: card.number.replace(/\s/g, ''),
              exp_month: card.expiry.split('/')[0],
              exp_year: card.expiry.split('/')[1],
              cvv: card.cvc
            }
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao processar pagamento')
        }

        setStep(2)
        onSuccess?.()
      } catch (error: any) {
        toast.error(error.message || 'Erro ao processar pagamento')
      } finally {
        setLoading(false)
      }
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={STEPS[step].id} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {STEPS.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
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
                        {Object.entries(PLANS).map(([id, plan]) => (
                          <Card
                            key={id}
                            className={cn(
                              "cursor-pointer p-6 transition-all duration-200 relative overflow-hidden",
                              "hover:border-accent/50 hover:shadow-lg",
                              planId === id
                                ? "border-accent bg-accent/5 shadow-md"
                                : "border-border hover:bg-muted/50"
                            )}
                            onClick={() => setPlanId(id as PlanId)}
                          >
                            {planId === id && (
                              <div className="absolute top-2 right-2 text-accent">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-lg">{plan.name}</h3>
                              <p className="text-muted-foreground">
                                {plan.price === 0 ? 'Free' : `R$ ${plan.price.toFixed(2)}/${plan.interval}`}
                              </p>
                              {id === 'yearly' && (
                                <p className="text-sm text-primary font-medium">
                                  Save 20% with yearly plan
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button disabled={!planId} onClick={() => setStep(1)}>
                          Continue
                        </Button>
                      </div>
                    </>
                  )}

                  {index === 1 && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={(e) => setCard({ ...card, number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card-name">Cardholder Name</Label>
                          <Input
                            id="card-name"
                            placeholder="John Doe"
                            value={card.name}
                            onChange={(e) => setCard({ ...card, name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="card-expiry">Expiry Date</Label>
                            <Input
                              id="card-expiry"
                              placeholder="MM/YY"
                              value={card.expiry}
                              onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card-cvc">CVC</Label>
                            <Input
                              id="card-cvc"
                              placeholder="123"
                              value={card.cvc}
                              onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button onClick={handleNext} disabled={loading}>
                          {loading ? 'Processing...' : 'Subscribe'}
                        </Button>
                      </div>
                    </>
                  )}

                  {index === 2 && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Subscription Created!</h3>
                      <p className="text-muted-foreground">
                        Your subscription has been successfully created. You can now access all premium features.
                      </p>
                      <Button onClick={() => router.push('/profile')}>
                        Go to Profile
                      </Button>
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
