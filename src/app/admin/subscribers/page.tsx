'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Loader2, Search, Download, RefreshCw } from 'lucide-react';
import { getPlanById } from '@/lib/plans';

interface Subscriber {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  created_at: string;
  current_period_end: string;
  user: {
    email: string;
    user_metadata: {
      name?: string;
    };
  };
  pagarme_subscription_id: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = useSupabaseClient();
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      // Buscar assinaturas normalmente
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Buscar usuários em lote
      const userIds = [...new Set((subscriptions || []).map(sub => sub.user_id).filter(Boolean))];
      let users: any[] = [];
      if (userIds.length > 0) {
        // Tenta buscar do schema auth.users (pode precisar de policy)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, user_metadata')
          .in('id', userIds);
        if (!usersError) users = usersData || [];
      }
      // Merge dos dados
      const subscribersWithUser = (subscriptions || []).map(sub => ({
        ...sub,
        user: users.find(u => u.id === sub.user_id) || { email: sub.user_id, user_metadata: {} }
      }));
      setSubscribers(subscribersWithUser);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Erro ao carregar assinantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const refreshSubscriptionStatus = async (subscriberId: string) => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/pagarme/subscription-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_id: subscriberId }),
      });

      if (!response.ok) throw new Error('Failed to refresh status');
      
      await fetchSubscribers(); // Reload the list
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.user.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.user.user_metadata?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.pagarme_subscription_id.includes(search);
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Plano', 'Status', 'Data de Início', 'Próxima Cobrança', 'ID Pagar.me'];
    const rows = filteredSubscribers.map(sub => [
      sub.user.user_metadata?.name || 'N/A',
      sub.user.email,
      getPlanById(sub.plan_id)?.name || sub.plan_id,
      sub.status,
      format(new Date(sub.created_at), 'dd/MM/yyyy'),
      format(new Date(sub.current_period_end), 'dd/MM/yyyy'),
      sub.pagarme_subscription_id
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assinantes_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Assinantes</CardTitle>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assinante</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próx. Cobrança</TableHead>
                    <TableHead>ID Pagar.me</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscriber.user.user_metadata?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscriber.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPlanById(subscriber.plan_id)?.name || subscriber.plan_id}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscriber.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscriber.status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {subscriber.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscriber.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(subscriber.current_period_end), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {subscriber.pagarme_subscription_id}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refreshSubscriptionStatus(subscriber.pagarme_subscription_id)}
                          disabled={refreshing}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 