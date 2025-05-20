"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { getAuthService } from '@/lib/auth/auth-service'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { handleError } from '@/lib/error-handler'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, Image as ImageIcon, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  type: string
  file_url: string
  category: string
  software: string
  tags: string[]
  thumb: string
  created_at: string
}

interface NewProduct {
  name: string
  description: string
  type: string
  file_url: string
  category: string
  software: string
  tags: string
  thumb: string
}

export function ProductsCRUD() {
  const { t } = useTranslations()
  const [products, setProducts] = useState<Product[]>([])
  const [uploading, setUploading] = useState(false)
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    description: '',
    type: '',
    file_url: '',
    category: '',
    software: '',
    tags: '',
    thumb: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<NewProduct & { id?: string }>({
    name: '',
    description: '',
    type: '',
    file_url: '',
    category: '',
    software: '',
    tags: '',
    thumb: '',
    id: ''
  })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const authService = getAuthService()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
  }

  const handleAddProduct = async () => {
    try {
      const tagsArray = newProduct.tags.split(',').map((t) => t.trim())
      const { error } = await supabase.from('products').insert([{ ...newProduct, tags: tagsArray }])
      if (error) {
        throw error
      }
      setNewProduct({ name: '', description: '', type: '', file_url: '', category: '', software: '', tags: '', thumb: '' })
      fetchProducts()
      toast.success(t?.admin?.products?.added || 'Product added successfully!')
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error adding product')
      toast.error(errorMessage)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        throw error
      }
      fetchProducts()
      toast.success(t?.admin?.products?.deleted || 'Product deleted successfully!')
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error deleting product')
      toast.error(errorMessage)
    }
  }

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const filePath = `thumbs/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('thumbs').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('thumbs').getPublicUrl(filePath)
      setNewProduct((prev) => ({ ...prev, thumb: publicUrlData.publicUrl }))
      toast.success(t?.admin?.products?.thumb?.uploaded || 'Thumb uploaded successfully!')
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error uploading thumb')
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      file_url: product.file_url,
      category: product.category,
      software: product.software,
      tags: product.tags.join(', '),
      thumb: product.thumb || ''
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (!editProduct.id) return
      const tagsArray = editProduct.tags.split(',').map((t) => t.trim())
      const { error } = await supabase.from('products').update({
        name: editProduct.name,
        description: editProduct.description,
        type: editProduct.type,
        file_url: editProduct.file_url,
        category: editProduct.category,
        software: editProduct.software,
        tags: tagsArray,
        thumb: editProduct.thumb
      }).eq('id', editProduct.id)
      if (error) throw error
      setEditingId(null)
      setEditProduct({ name: '', description: '', type: '', file_url: '', category: '', software: '', tags: '', thumb: '', id: '' })
      fetchProducts()
      toast.success('Produto atualizado!')
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Erro ao atualizar produto')
      toast.error(errorMessage)
    }
  }

  // Filtro e busca
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.join(',').toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border rounded px-3 py-2 text-sm bg-background"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">Todos os tipos</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>
      <div className="bg-muted rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-2">Adicionar novo produto</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nome</label>
            <Input placeholder="Ex: Caixa de ferramentas" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tipo</label>
            <Input placeholder="free ou premium" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Categoria</label>
            <Input placeholder="Ex: Design" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Software</label>
            <Input placeholder="Ex: Figma, Photoshop..." value={newProduct.software} onChange={e => setNewProduct({ ...newProduct, software: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Tags</label>
            <Input placeholder="Ex: ui, ux, wireframe" value={newProduct.tags} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">File URL</label>
            <Input placeholder="Link do arquivo" value={newProduct.file_url} onChange={e => setNewProduct({ ...newProduct, file_url: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea placeholder="Breve descrição do produto" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Thumb (upload)</label>
            <Input type="file" accept="image/*" onChange={handleThumbUpload} />
            {uploading ? <p className="text-sm text-muted-foreground">Enviando imagem...</p> : newProduct.thumb && (
              <img src={newProduct.thumb} alt="Thumb preview" className="mt-2 w-24 h-24 object-cover rounded border" />
            )}
          </div>
        </div>
        <Button onClick={handleAddProduct} className="mt-4 w-full md:w-auto">Adicionar Produto</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => (
          <Card key={p.id} className="group relative overflow-hidden shadow-sm hover:shadow-lg transition-shadow border-0 bg-card">
            <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
              {p.thumb ? (
                <img src={p.thumb} alt={p.name} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-xs">Sem imagem</span>
                </div>
              )}
            </div>
            <CardContent className="p-4 flex flex-col gap-2">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Nome</label>
                    <Input placeholder="Ex: Caixa de ferramentas" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea placeholder="Breve descrição do produto" value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Tipo</label>
                    <Input placeholder="free ou premium" value={editProduct.type} onChange={e => setEditProduct({ ...editProduct, type: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Categoria</label>
                    <Input placeholder="Ex: Design" value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Software</label>
                    <Input placeholder="Ex: Figma, Photoshop..." value={editProduct.software} onChange={e => setEditProduct({ ...editProduct, software: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Tags</label>
                    <Input placeholder="Ex: ui, ux, wireframe" value={editProduct.tags} onChange={e => setEditProduct({ ...editProduct, tags: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">File URL</label>
                    <Input placeholder="Link do arquivo" value={editProduct.file_url} onChange={e => setEditProduct({ ...editProduct, file_url: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Thumb URL</label>
                    <Input placeholder="Link da imagem" value={editProduct.thumb} onChange={e => setEditProduct({ ...editProduct, thumb: e.target.value })} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleSaveEdit} variant="default">Salvar</Button>
                    <Button onClick={() => setEditingId(null)} variant="outline">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg truncate flex-1" title={p.name}>{p.name}</span>
                    <Badge variant={p.type === 'premium' ? 'destructive' : 'default'}>{p.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{p.description}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button size="icon" variant="outline" onClick={() => startEdit(p)} title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteProduct(p.id)} title="Deletar">
                      <Trash2 className="h-4 w-4" />
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