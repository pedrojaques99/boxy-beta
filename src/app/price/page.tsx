'use client';

import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function PricePage() {
  const user = useUser()
  const router = useRouter()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const handleSubscribe = () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setIsCheckoutOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Escolha seu plano</h1>
        <p className="text-muted-foreground">Comece a usar o Boxy hoje mesmo</p>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSubscribe}>
          Assinar Agora
        </Button>
      </div>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CheckoutWizard onSuccess={() => setIsCheckoutOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
} 