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

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<ResourceDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const supabase = useSupabaseClient();

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('downloads')
        .select(`
          *,
          user:user_id (
            email,
            user_metadata
          ),
          resource:resource_id (
            id,
            title,
            type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDownloads(data || []);
    } catch (error) {
      console.error('Error fetching downloads:', error);
      toast.error('Erro ao carregar downloads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const filteredDownloads = downloads.filter(download => {
    const matchesSearch = 
      download.user.email.toLowerCase().includes(search.toLowerCase()) ||
      download.user.user_metadata?.name?.toLowerCase().includes(search.toLowerCase()) ||
      download.resource.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || download.resource.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const exportToCSV = () => {
    const headers = ['Data', 'Usuário', 'Email', 'Recurso', 'Tipo'];
    const rows = filteredDownloads.map(download => [
      format(new Date(download.created_at), 'dd/MM/yyyy HH:mm'),
      download.user.user_metadata?.name || 'N/A',
      download.user.email,
      download.resource.title,
      download.resource.type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `downloads_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  // Get unique resource types
  const resourceTypes = Array.from(new Set(downloads.map(d => d.resource.type)));

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-bold">Downloads</CardTitle>
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
                placeholder="Buscar por usuário, email ou recurso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {resourceTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
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
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDownloads.map((download) => (
                    <TableRow key={download.id}>
                      <TableCell>
                        {format(new Date(download.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {download.user.user_metadata?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {download.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{download.resource.title}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                          {download.resource.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/resources/${download.resource.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Download Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{downloads.length}</div>
                <div className="text-sm text-muted-foreground">Total de Downloads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(downloads.map(d => d.user_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Usuários Únicos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(downloads.map(d => d.resource_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Recursos Únicos</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 