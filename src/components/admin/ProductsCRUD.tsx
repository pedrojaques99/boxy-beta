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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t?.admin?.products?.title || 'Products CRUD'}</h2>
      <div className="grid gap-2">
        <Input placeholder={t?.admin?.products?.name || 'Name'} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
        <Textarea placeholder={t?.admin?.products?.description || 'Description'} value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
        <Input placeholder={t?.admin?.products?.type || 'Type'} value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })} />
        <Input placeholder={t?.admin?.products?.category || 'Category'} value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
        <Input placeholder={t?.admin?.products?.software || 'Software'} value={newProduct.software} onChange={(e) => setNewProduct({ ...newProduct, software: e.target.value })} />
        <Input placeholder={t?.admin?.products?.tags || 'Tags (comma separated)'} value={newProduct.tags} onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })} />
        <Input placeholder={t?.admin?.products?.file_url || 'File URL'} value={newProduct.file_url} onChange={(e) => setNewProduct({ ...newProduct, file_url: e.target.value })} />

        <div className="space-y-1">
          <label className="text-sm font-medium">{t?.admin?.products?.thumb?.label || 'Thumb (direct upload)'}</label>
          <Input type="file" accept="image/*" onChange={handleThumbUpload} />
          {uploading ? <p className="text-sm text-muted-foreground">{t?.admin?.products?.thumb?.uploading || 'Uploading...'}</p> : newProduct.thumb && (
            <img src={newProduct.thumb} alt={t?.admin?.products?.thumb?.alt || 'Thumb preview'} className="mt-2 w-32 h-32 object-cover rounded" />
          )}
        </div>

        <Button onClick={handleAddProduct}>{t?.admin?.products?.add || 'Add Product'}</Button>
      </div>

      <div className="grid gap-4 pt-4">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              {editingId === p.id ? (
                <div className="space-y-2">
                  <Input placeholder="Nome" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                  <Textarea placeholder="Descrição" value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
                  <Input placeholder="Tipo" value={editProduct.type} onChange={e => setEditProduct({ ...editProduct, type: e.target.value })} />
                  <Input placeholder="Categoria" value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} />
                  <Input placeholder="Software" value={editProduct.software} onChange={e => setEditProduct({ ...editProduct, software: e.target.value })} />
                  <Input placeholder="Tags (separadas por vírgula)" value={editProduct.tags} onChange={e => setEditProduct({ ...editProduct, tags: e.target.value })} />
                  <Input placeholder="File URL" value={editProduct.file_url} onChange={e => setEditProduct({ ...editProduct, file_url: e.target.value })} />
                  <Input placeholder="Thumb URL" value={editProduct.thumb} onChange={e => setEditProduct({ ...editProduct, thumb: e.target.value })} />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleSaveEdit} variant="default">Salvar</Button>
                    <Button onClick={() => setEditingId(null)} variant="outline">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                    <div className="text-xs">{p.tags.join(', ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => startEdit(p)} variant="outline">Editar</Button>
                    <Button variant="destructive" onClick={() => handleDeleteProduct(p.id)}>
                      {t?.admin?.products?.delete || 'Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 