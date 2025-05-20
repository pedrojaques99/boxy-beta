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
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Loader2, Search, Download, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface ResourceDownload {
  id: string;
  created_at: string;
  user: {
    email: string;
    user_metadata: {
      name?: string;
    };
  };
  resource: {
    id: string;
    title: string;
    type: string;
  };
}

export default function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState<ResourceDownload[]>([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Buscar downloads com informações do produto
      const { data: downloadsData, error: downloadsError } = await supabase
        .from('downloads')
        .select(`
          id,
          user_id,
          product_id,
          download_date,
          status,
          products (
            name,
            type
          )
        `)
        .order('download_date', { ascending: false });
      if (downloadsError) throw downloadsError;
      // Buscar usuários em lote
      const userIds = [...new Set((downloadsData || []).map((d: any) => d.user_id).filter(Boolean))];
      let users: any[] = [];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        if (!usersError) users = usersData || [];
      }
      // Merge dos dados
      const downloadsWithUser = (downloadsData || []).map((d: any) => ({
        ...d,
        user: users.find(u => u.id === d.user_id) || { email: d.user_id }
      }));
      setDownloads(downloadsWithUser);
      // Buscar assinantes com informações do usuário (mantém como estava)
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          started_at,
          current_period_end
        `)
        .order('started_at', { ascending: false });
      if (subscribersError) throw subscribersError;
      setSubscribers(subscribersData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
      case 'canceled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Tabs defaultValue="downloads">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="downloads" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Downloads
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assinantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Downloads</span>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar downloads..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.map((download: any) => (
                    <TableRow key={download.id}>
                      <TableCell>
                        {format(new Date(download.download_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{download.user.email}</TableCell>
                      <TableCell>{download.products?.name}</TableCell>
                      <TableCell>{download.products?.type}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(download.status)}>
                          {download.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Assinantes</span>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar assinantes..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber: any) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>
                        {format(new Date(subscriber.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{subscriber.auth?.users?.email}</TableCell>
                      <TableCell>{subscriber.plan_id}</TableCell>
                      <TableCell>
                        {format(new Date(subscriber.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(subscriber.status)}>
                          {subscriber.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 