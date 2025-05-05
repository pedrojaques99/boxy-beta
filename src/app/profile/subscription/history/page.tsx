'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getAuthService } from '@/lib/auth/auth-service'
import { formatPrice, getPlanById, PlanId } from '@/lib/plans'
import { Subscription } from '@/types/subscription'
import { ArrowLeft, Calendar, CreditCard, Download, Search, FileText, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from '@/hooks/use-translations'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Invoice {
  id: string
  status: string
  amount: number
  payment_method: string
  created_at: string
  invoice_url?: string
  subscription_id: string
  description?: string
}

export default function PaymentHistoryPage() {
  const user = useUser()
  const { t } = useTranslations()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const authService = getAuthService()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm, statusFilter])

  const loadData = async () => {
    if (!user) return
    try {
      // Carregar assinatura
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subError && subError.code !== 'PGRST116') throw subError

      setSubscription(subData || null)

      // Simular carregamento do histórico de pagamentos - Numa implementação real, você carregaria isso da API
      // Aqui estamos criando dados fictícios para demonstração
      setInvoices(generateMockInvoices(subData?.id))

    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }
    
    setFilteredInvoices(filtered)
  }

  // Função para gerar dados fictícios de pagamentos
  const generateMockInvoices = (subscriptionId?: string): Invoice[] => {
    if (!subscriptionId) return []
    
    const statuses = ['paid', 'pending', 'failed', 'refunded']
    const paymentMethods = ['credit_card', 'boleto', 'pix']
    
    return Array.from({ length: 10 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      
      const status = i === 0 ? 'paid' : statuses[Math.floor(Math.random() * statuses.length)]
      const amount = Math.floor(Math.random() * 5000) + 5000 // Valor entre 50 e 100 reais (em centavos)
      
      return {
        id: `inv_${Math.random().toString(36).substring(2, 10)}`,
        status,
        amount,
        payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        created_at: date.toISOString(),
        invoice_url: status === 'paid' ? `https://example.com/invoice_${i}` : undefined,
        subscription_id: subscriptionId,
        description: `Pagamento ${i + 1} - Plano ${subscription?.plan_id || 'BOXY'}`
      }
    })
  }

  // Função para traduzir o status do pagamento
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago'
      case 'pending': return 'Pendente'
      case 'failed': return 'Falhou'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  // Função para obter a cor do badge baseado no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'refunded': return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  // Função para traduzir o método de pagamento
  const getPaymentMethodTranslation = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito'
      case 'boleto': return 'Boleto'
      case 'pix': return 'PIX'
      default: return method
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-center mb-4">Você precisa estar logado para acessar esta página.</p>
            <Button onClick={() => router.push('/auth/login')}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-center">Carregando histórico de pagamentos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Visualize todos os seus pagamentos e faturas</CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push('/profile/subscription')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Assinaturas
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Você ainda não possui histórico de pagamentos.</p>
              <p className="text-sm text-muted-foreground">Os pagamentos aparecerão aqui após sua primeira cobrança.</p>
            </div>
          ) : (
            <>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID ou descrição..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="failed">Falhas</SelectItem>
                    <SelectItem value="refunded">Reembolsados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de pagamentos */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          Nenhum resultado encontrado para os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(invoice.created_at), 'dd/MM/yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.description}</TableCell>
                          <TableCell>{formatPrice(invoice.amount / 100)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span>{getPaymentMethodTranslation(invoice.payment_method)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {getStatusTranslation(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {invoice.invoice_url && (
                              <Button size="sm" variant="ghost" asChild>
                                <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Fatura
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredInvoices.length} de {invoices.length} pagamentos
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 