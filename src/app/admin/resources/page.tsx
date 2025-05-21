"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Image as ImageIcon, Edit2, Trash2, CheckCircle, XCircle, Search } from 'lucide-react'

interface Resource {
  id: string
  created_at: string
  updated_at: string
  featured: boolean
  created_by: string
  approved: boolean
  url: string
  thumbnail_url: string
  price_model: string
  tags: string[]
  title: string
  category: string
  subcategory: string
  software: string
  description: string
  description_en: string
}

interface NewResource {
  title: string
  url: string
  thumbnail_url: string
  price_model: string
  tags: string
  category: string
  subcategory: string
  software: string
  description: string
  description_en: string
}

export default function ResourcesAdminPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [newResource, setNewResource] = useState<NewResource>({
    title: '', url: '', thumbnail_url: '', price_model: '', tags: '', category: '', subcategory: '', software: '', description: '', description_en: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editResource, setEditResource] = useState<NewResource & { id?: string }>({
    title: '', url: '', thumbnail_url: '', price_model: '', tags: '', category: '', subcategory: '', software: '', description: '', description_en: '', id: ''
  })
  const [search, setSearch] = useState('')
  const [approvedFilter, setApprovedFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => { fetchResources() }, [])

  const fetchResources = async () => {
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
    if (!error) setResources(data || [])
  }

  const handleAddResource = async () => {
    try {
      const tagsArray = newResource.tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error } = await supabase.from('resources').insert([{ ...newResource, tags: tagsArray }])
      if (error) throw error
      setNewResource({ title: '', url: '', thumbnail_url: '', price_model: '', tags: '', category: '', subcategory: '', software: '', description: '', description_en: '' })
      fetchResources()
      toast.success('Resource adicionado!')
    } catch (error) {
      toast.error('Erro ao adicionar resource')
    }
  }

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id)
      if (error) throw error
      fetchResources()
      toast.success('Resource deletado!')
    } catch (error) {
      toast.error('Erro ao deletar resource')
    }
  }

  const startEdit = (resource: Resource) => {
    setEditingId(resource.id)
    setEditResource({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      thumbnail_url: resource.thumbnail_url,
      price_model: resource.price_model,
      tags: resource.tags.join(', '),
      category: resource.category,
      subcategory: resource.subcategory,
      software: resource.software,
      description: resource.description,
      description_en: resource.description_en
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (!editResource.id) return
      const tagsArray = editResource.tags.split(',').map(t => t.trim()).filter(Boolean)
      const { error } = await supabase.from('resources').update({
        title: editResource.title,
        url: editResource.url,
        thumbnail_url: editResource.thumbnail_url,
        price_model: editResource.price_model,
        tags: tagsArray,
        category: editResource.category,
        subcategory: editResource.subcategory,
        software: editResource.software,
        description: editResource.description,
        description_en: editResource.description_en
      }).eq('id', editResource.id)
      if (error) throw error
      setEditingId(null)
      setEditResource({ title: '', url: '', thumbnail_url: '', price_model: '', tags: '', category: '', subcategory: '', software: '', description: '', description_en: '', id: '' })
      fetchResources()
      toast.success('Resource atualizado!')
    } catch (error) {
      toast.error('Erro ao atualizar resource')
    }
  }

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase.from('resources').update({ approved: !approved }).eq('id', id)
      if (error) throw error
      fetchResources()
      toast.success(!approved ? 'Resource aprovado!' : 'Resource reprovado!')
    } catch (error) {
      toast.error('Erro ao aprovar/reprovar resource')
    }
  }

  // Filtro e busca
  const filteredResources = resources.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.join(',').toLowerCase().includes(search.toLowerCase())
    const matchesApproved = approvedFilter === 'all' || (approvedFilter === 'approved' ? r.approved : !r.approved)
    return matchesSearch && matchesApproved
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border rounded px-3 py-2 text-sm bg-background"
          value={approvedFilter}
          onChange={e => setApprovedFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="pending">Pendentes</option>
        </select>
      </div>
      <div className="bg-muted rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-2">Adicionar novo resource</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Título</label>
            <Input placeholder="Título do resource" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">URL</label>
            <Input placeholder="Link do resource" value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Thumb URL</label>
            <Input placeholder="Link da imagem" value={newResource.thumbnail_url} onChange={e => setNewResource({ ...newResource, thumbnail_url: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Modelo de preço</label>
            <Input placeholder="free, premium, etc" value={newResource.price_model} onChange={e => setNewResource({ ...newResource, price_model: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tags</label>
            <Input placeholder="Ex: ui, ux, wireframe" value={newResource.tags} onChange={e => setNewResource({ ...newResource, tags: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Categoria</label>
            <Input placeholder="Ex: Design" value={newResource.category} onChange={e => setNewResource({ ...newResource, category: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Subcategoria</label>
            <Input placeholder="Ex: UI Kits" value={newResource.subcategory} onChange={e => setNewResource({ ...newResource, subcategory: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Software</label>
            <Input placeholder="Ex: Figma, Photoshop..." value={newResource.software} onChange={e => setNewResource({ ...newResource, software: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea placeholder="Breve descrição do resource" value={newResource.description} onChange={e => setNewResource({ ...newResource, description: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Descrição (EN)</label>
            <Textarea placeholder="Short description in English" value={newResource.description_en} onChange={e => setNewResource({ ...newResource, description_en: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleAddResource} className="mt-4 w-full md:w-auto">Adicionar Resource</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredResources.map((r) => (
          <Card key={r.id} className="group relative overflow-hidden shadow-sm hover:shadow-lg transition-shadow border-0 bg-card">
            <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
              {r.thumbnail_url ? (
                <img src={r.thumbnail_url} alt={r.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
            </div>
            <CardContent className="p-4 flex flex-col gap-2">
              {editingId === r.id ? (
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Título</label>
                    <Input placeholder="Título do resource" value={editResource.title} onChange={e => setEditResource({ ...editResource, title: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">URL</label>
                    <Input placeholder="Link do resource" value={editResource.url} onChange={e => setEditResource({ ...editResource, url: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Thumb URL</label>
                    <Input placeholder="Link da imagem" value={editResource.thumbnail_url} onChange={e => setEditResource({ ...editResource, thumbnail_url: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Modelo de preço</label>
                    <Input placeholder="free, premium, etc" value={editResource.price_model} onChange={e => setEditResource({ ...editResource, price_model: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Tags</label>
                    <Input placeholder="Ex: ui, ux, wireframe" value={editResource.tags} onChange={e => setEditResource({ ...editResource, tags: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Categoria</label>
                    <Input placeholder="Ex: Design" value={editResource.category} onChange={e => setEditResource({ ...editResource, category: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Subcategoria</label>
                    <Input placeholder="Ex: UI Kits" value={editResource.subcategory} onChange={e => setEditResource({ ...editResource, subcategory: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Software</label>
                    <Input placeholder="Ex: Figma, Photoshop..." value={editResource.software} onChange={e => setEditResource({ ...editResource, software: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea placeholder="Breve descrição do resource" value={editResource.description} onChange={e => setEditResource({ ...editResource, description: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Descrição (EN)</label>
                    <Textarea placeholder="Short description in English" value={editResource.description_en} onChange={e => setEditResource({ ...editResource, description_en: e.target.value })} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleSaveEdit} variant="default">Salvar</Button>
                    <Button onClick={() => setEditingId(null)} variant="outline">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg truncate flex-1" title={r.title}>{r.title}</span>
                    <Badge variant={r.approved ? 'default' : 'destructive'}>{r.approved ? 'Aprovado' : 'Pendente'}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{r.description}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button size="icon" variant="outline" onClick={() => startEdit(r)} title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteResource(r.id)} title="Deletar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant={r.approved ? 'outline' : 'default'} onClick={() => handleApprove(r.id, r.approved)} title={r.approved ? 'Reprovar' : 'Aprovar'}>
                      {r.approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 