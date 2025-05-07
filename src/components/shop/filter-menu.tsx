'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ArrowUpDown, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dictionary } from '@/i18n/types'

export interface FilterMenuProps {
  categories: string[]
  software: string[]
  t: Dictionary
}

export function FilterMenu({ categories, software, t }: FilterMenuProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterClick = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (params.get(type) === value) {
      params.delete(type)
    } else {
      params.set(type, value)
    }
    
    router.push(`?${params.toString()}`)
  }

  const isActive = (type: string, value: string) => {
    return searchParams.get(type) === value
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-2">
        <Label>{t?.shop?.filters?.category}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!searchParams.get('category') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick('category', '')}
        >
            {t?.shop?.filters?.all}
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={isActive('category', category) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterClick('category', category)}
            >
                  {category}
            </Button>
              ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t?.shop?.filters?.software}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!searchParams.get('software') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick('software', '')}
          >
            {t?.shop?.filters?.all}
          </Button>
          {software.map((sw) => (
            <Button
              key={sw}
              variant={isActive('software', sw) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterClick('software', sw)}
          >
              {sw}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t?.shop?.filters?.type}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!searchParams.get('type') ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick('type', '')}
          >
            {t?.shop?.filters?.all}
          </Button>
          {['textures', 'models', 'materials', 'hdris', 'plugins'].map((type) => (
            <Button
              key={type}
              variant={isActive('type', type) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterClick('type', type)}
            >
              {t?.shop?.filters?.[type as keyof typeof t.shop.filters] || type}
              </Button>
          ))}
        </div>
      </div>
    </div>
  )
} 