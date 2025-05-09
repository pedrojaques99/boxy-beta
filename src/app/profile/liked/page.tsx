'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/hooks/use-translations'
import { useUser } from '@supabase/auth-helpers-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Loader2, Heart, Search, Download, Trash2 } from 'lucide-react'

interface Resource {
  id: string
  name: string
  category: string
  file_url: string
}

interface LikedResource {
  id: string
  resource_id: string
  user_id: string
  created_at: string
  resource: Resource
}

export default function LikedResourcesPage() {
  const { t } = useTranslations()
  const user = useUser()
  const supabase = useSupabaseClient()
  const [resources, setResources] = useState<LikedResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  // Add safeT function for translation
  const safeT = (key: string): string => {
    if (!t) return key;
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  useEffect(() => {
    if (user) {
      loadLikedResources()
    }
  }, [user])

  const loadLikedResources = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select(`
          id,
          name,
          category,
          file_url
        `)

      if (resourcesError) throw resourcesError

      const { data: likedData, error: likedError } = await supabase
        .from('liked_resources')
        .select('*')
        .eq('user_id', user?.id)

      if (likedError) throw likedError

      // Map the liked resources with their full resource data
      const likedResources = likedData.map(liked => {
        const resource = resourcesData.find(r => r.id === liked.resource_id)
        return {
          id: liked.id,
          resource_id: liked.resource_id,
          user_id: liked.user_id,
          created_at: liked.created_at,
          resource: resource || {
            id: liked.resource_id,
            name: 'Resource not found',
            category: 'Unknown',
            file_url: ''
          }
        }
      })

      setResources(likedResources)

      // Extract unique categories
      const uniqueCategories = [...new Set(resourcesData.map(r => r.category))]
      setCategories(uniqueCategories)

    } catch (err) {
      console.error('Error loading liked resources:', err)
      setError(err instanceof Error ? err.message : 'Failed to load liked resources')
      toast.error('Failed to load liked resources')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlike = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('liked_resources')
        .delete()
        .eq('resource_id', resourceId)
        .eq('user_id', user?.id)

      if (error) throw error

      setResources(prev => prev.filter(r => r.resource_id !== resourceId))
      toast.success(safeT('profile.likedResources.unlikeSuccess'))
    } catch (error) {
      console.error('Error removing resource from favorites:', error)
      toast.error(safeT('profile.likedResources.unlikeError'))
    }
  }

  const handleDownload = async (resource: Resource) => {
    try {
      if (!resource.file_url) {
        throw new Error('Download URL not available')
      }

      // Log the download
      await supabase.from('downloads').insert({
        user_id: user?.id,
        resource_id: resource.id,
        downloaded_at: new Date().toISOString()
      })

      // Start the download
      window.open(resource.file_url, '_blank')
      toast.success(safeT('profile.likedResources.downloadStarted'))
    } catch (error) {
      console.error('Error downloading resource:', error)
      toast.error(safeT('profile.likedResources.downloadError'))
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.resource.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || resource.resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{safeT('profile.likedResources.loading')}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-destructive text-center mb-4">{error}</p>
            <Button onClick={() => loadLikedResources()}>
              {safeT('profile.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{safeT('profile.likedResources.title')}</CardTitle>
          <CardDescription>{safeT('profile.likedResources.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={safeT('profile.likedResources.filters.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={safeT('profile.likedResources.filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{safeT('profile.likedResources.filters.allCategories')}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{safeT('profile.likedResources.noLikes')}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{safeT('profile.likedResources.table.resource')}</TableHead>
                    <TableHead>{safeT('profile.likedResources.table.category')}</TableHead>
                    <TableHead>{safeT('profile.likedResources.table.addedAt')}</TableHead>
                    <TableHead className="text-right">{safeT('profile.likedResources.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.resource.name}</TableCell>
                      <TableCell>{item.resource.category}</TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownload(item.resource)}
                            disabled={!item.resource.file_url}
                            title={item.resource.file_url ? 'Download' : 'Download not available'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUnlike(item.resource_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
  )
} 