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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadLikedResources()
    }
  }, [user])

  const loadLikedResources = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('liked_resources')
        .select(`
          id,
          resource_id,
          user_id,
          created_at,
          resource:resources (
            name,
            category,
            file_url
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // First cast to unknown, then validate and transform the data
      const rawData = data as unknown
      if (Array.isArray(rawData)) {
        const validData = rawData.filter((item): item is LikedResource => {
          return (
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string' &&
            typeof item.resource_id === 'string' &&
            typeof item.user_id === 'string' &&
            typeof item.created_at === 'string' &&
            typeof item.resource === 'object' &&
            item.resource !== null &&
            typeof item.resource.name === 'string' &&
            typeof item.resource.category === 'string' &&
            typeof item.resource.file_url === 'string'
          )
        })

        setResources(validData)
        const uniqueCategories = [...new Set(validData.map(item => item.resource.category))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error loading liked resources:', error)
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
      toast.success('Resource removed from favorites')
    } catch (error) {
      console.error('Error removing resource from favorites:', error)
      toast.error('Failed to remove resource from favorites')
    }
  }

  const handleDownload = async (fileUrl: string) => {
    try {
      // Implement download logic here
      window.open(fileUrl, '_blank')
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading resource:', error)
      toast.error('Failed to download resource')
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.resource.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || resource.resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t?.profile?.likedResources?.loading}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t?.profile?.likedResources?.title}</CardTitle>
          <CardDescription>{t?.profile?.likedResources?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t?.profile?.likedResources?.filters?.search}
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
                <SelectValue placeholder={t?.profile?.likedResources?.filters?.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t?.profile?.likedResources?.noLikes}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t?.profile?.likedResources?.table?.resource}</TableHead>
                    <TableHead>{t?.profile?.likedResources?.table?.category}</TableHead>
                    <TableHead>{t?.profile?.likedResources?.table?.addedAt}</TableHead>
                    <TableHead className="text-right">{t?.profile?.likedResources?.table?.actions}</TableHead>
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
                            onClick={() => handleDownload(item.resource.file_url)}
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