'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, getPlanById, PlanId } from '@/lib/plans'
import { Subscription } from '@/types/subscription'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTranslations } from '@/hooks/use-translations'

export default function SubscriptionPage() {
  const user = useUser()
  const t = useTranslations()
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
      console.error('Error loading subscription:', err)
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

  const plan = subscription ? getPlanById(subscription.plan_id as PlanId) : null

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t?.profile?.subscription?.title || 'Subscription'}</CardTitle>
          <CardDescription>
            {t?.profile?.subscription?.description || 'Manage your subscription plan'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Carregando...</div>
          ) : subscription ? (
            <>
              <div>
                <h3 className="font-semibold">{t?.profile?.subscription?.currentPlan || 'Current Plan'}</h3>
                <p className="text-muted-foreground">
                  {plan?.name || subscription.plan_id}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{t?.profile?.subscription?.status || 'Status'}</h3>
                <p className="text-muted-foreground capitalize">
                  {subscription.status}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">{t?.profile?.subscription?.nextBilling || 'Next Billing'}</h3>
                <p className="text-muted-foreground">
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleUpdateCard}
                >
                  {t?.profile?.subscription?.changePlan || 'Change Plan'}
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
                {t?.profile?.subscription?.noSubscription || 'No active subscription'}
              </p>
              <Button onClick={() => setIsCheckoutOpen(true)}>
                {t?.profile?.subscription?.subscribe || 'Subscribe Now'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CheckoutWizard 
            defaultPlanId={subscription?.plan_id as PlanId} 
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