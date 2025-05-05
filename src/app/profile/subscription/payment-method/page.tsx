'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Subscription } from '@/types/subscription'
import { AlertCircle, ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function PaymentMethodPage() {
  const user = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    cpf: ''
  })
  const supabase = createClient()
  const router = useRouter()

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
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignorar erro "não encontrado"
      setSubscription(data || null)
      
      // Pre-populate CPF from user metadata if available
      if (user.user_metadata?.cpf) {
        setCard(c => ({ ...c, cpf: user.user_metadata.cpf }))
      }
      
      // Pre-populate name from user metadata if available
      if (user.user_metadata?.full_name) {
        setCard(c => ({ ...c, name: user.user_metadata.full_name }))
      }
    } catch (err) {
      console.error('Error loading subscription:', err)
      toast.error('Erro ao carregar assinatura')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!card.number || card.number.length < 16) {
      toast.error('Número do cartão inválido')
      return
    }
    
    if (!card.name) {
      toast.error('Nome no cartão é obrigatório')
      return
    }
    
    if (!card.expiry || card.expiry.length < 5) {
      toast.error('Data de validade inválida')
      return
    }
    
    if (!card.cvv || card.cvv.length < 3) {
      toast.error('CVV inválido')
      return
    }
    
    if (!card.cpf || card.cpf.length < 11) {
      toast.error('CPF inválido')
      return
    }
    
    if (!subscription?.pagarme_subscription_id) {
      toast.error('ID da assinatura não encontrado')
      return
    }
    
    setSaving(true)
    try {
      // Em uma implementação real, você enviaria esses dados para a API
      // Aqui estamos apenas simulando a atualização
      
      // Simulando uma chamada de API com tempo de espera
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Método de pagamento atualizado com sucesso')
      router.push('/profile/subscription')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar método de pagamento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-center">Carregando informações...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Atualizar Método de Pagamento</CardTitle>
            <CardDescription>Atualize as informações do seu cartão de crédito</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-center mb-4">Você não possui uma assinatura ativa.</p>
            <Button variant="outline" onClick={() => router.push('/profile/subscription')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Assinaturas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Atualizar Método de Pagamento</CardTitle>
          <CardDescription>Atualize as informações do seu cartão de crédito</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Número do Cartão</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '') })}
                    maxLength={16}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-name">Nome no Cartão</Label>
                <Input
                  id="card-name"
                  placeholder="Nome como está no cartão"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Validade</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/AA"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  placeholder="123"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                  maxLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cpf">CPF do Titular</Label>
                <Input
                  id="card-cpf"
                  placeholder="Apenas números"
                  value={card.cpf}
                  onChange={(e) => setCard({ ...card, cpf: e.target.value.replace(/\D/g, '') })}
                  maxLength={11}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => router.push('/profile/subscription')}
              type="button"
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 