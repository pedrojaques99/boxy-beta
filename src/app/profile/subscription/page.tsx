'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getPlanById } from '@/lib/plans'
import { Subscription } from '@/types/subscription'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SubscriptionPage() {
  const user = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setSubscription(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!subscription) return
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return

    try {
      const res = await fetch(`/api/pagarme/subscription/${subscription.pagarme_subscription_id}/cancel`, {
        method: 'PUT'
      })

      if (!res.ok) {
        throw new Error('Erro ao cancelar assinatura')
      }

      await loadSubscription()
      toast.success('Assinatura cancelada com sucesso')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cancelar assinatura')
    }
  }

  const handleUpdateCard = async () => {
    setIsCheckoutOpen(true)
  }

  if (!user) return null

  const plan = subscription ? getPlanById(subscription.plan_id) : null

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Minha Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Carregando...</div>
          ) : subscription ? (
            <>
              <div>
                <h3 className="text-lg font-semibold">Plano Atual</h3>
                <p className="text-muted-foreground">
                  {plan?.name} - {formatPrice(plan?.price || 0)}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Status</h3>
                <p className="text-muted-foreground capitalize">
                  {subscription.status}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Próximo Pagamento</h3>
                <p className="text-muted-foreground">
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleUpdateCard}
                >
                  Atualizar Cartão
                </Button>
                {subscription.status !== 'canceled' && (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel}
                  >
                    Cancelar Assinatura
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Você ainda não tem uma assinatura ativa.
              </p>
              <Button onClick={() => setIsCheckoutOpen(true)}>
                Assinar Agora
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CheckoutWizard 
            defaultPlanId={subscription?.plan_id} 
            onSuccess={() => {
              setIsCheckoutOpen(false)
              loadSubscription()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 