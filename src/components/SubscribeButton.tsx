'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useUser } from '@supabase/auth-helpers-react'
import { handleError } from '@/lib/error-handler'
import { toast } from 'sonner'

type Props = {
  plan_id: string // ID do plano no Pagar.me
  variant?: 'default' | 'outline'
}

export function SubscribeButton({ plan_id, variant = 'default' }: Props) {
  const user = useUser()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Você precisa estar logado.');
      return;
    }

    setLoading(true)

    try {
      const res = await fetch('/api/pagarme/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email, // fallback
          plan_id,
          payment_method: 'credit_card',
          card: {
            number: '4111111111111111', // teste sandbox
            holder_name: 'NOME TESTE',
            exp_month: '12',
            exp_year: '2028',
            cvv: '123'
          }
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Assinatura criada com sucesso!')
    } catch (err) {
      const { error: errorMessage } = handleError(err, 'Error creating subscription');
      toast.error(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Button variant={variant} className="w-full" onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Assinando...' : 'Assinar Agora'}
    </Button>
  )
}
