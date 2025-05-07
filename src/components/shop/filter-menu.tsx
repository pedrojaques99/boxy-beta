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

interface FilterMenuProps {
  categories: string[]
  software: string[]
}

export function FilterMenu({ categories, software }: FilterMenuProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Derive filtros diretamente da URL
  const category = searchParams.get('category') || 'all'
  const softwareValue = searchParams.get('software') || 'all'
  const isFree = searchParams.get('free') === 'true'
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  const handleFilterChange = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'isFree') {
      if (value) params.set('free', 'true')
      else params.delete('free')
    } else if (key === 'category' || key === 'software') {
      if (value === 'all' || value === null) params.delete(key)
      else params.set(key, value as string)
    } else if (key === 'sortBy' || key === 'sortOrder') {
      params.set(key, value as string)
    }
    router.push(`/shop?${params.toString()}`)
  }

  const hasActiveFilters = category !== 'all' || softwareValue !== 'all' || isFree || sortBy !== 'created_at'

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap justify-between gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm w-[90%] mx-auto"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-light">Filters</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="free-filter"
            checked={isFree}
            onCheckedChange={(checked) => handleFilterChange('isFree', checked === true)}
            className="border-border/50"
          />
          <Label htmlFor="free-filter" className="text-sm font-medium text-muted-foreground hover:cursor-pointer">
            Freebies
          </Label>
        </div>

        <Select
          value={category}
          onValueChange={(value: string) => handleFilterChange('category', value)}
        >
          <SelectTrigger 
            className="w-[160px] bg-background border-border/50 hover:bg-accent/5 transition-colors"
          >
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </motion.div>
          </SelectContent>
        </Select>

        <Select
          value={softwareValue}
          onValueChange={(value: string) => handleFilterChange('software', value)}
        >
          <SelectTrigger 
            className="w-[160px] bg-background border-border/50 hover:bg-accent/5 transition-colors"
          >
            <SelectValue placeholder="Software" />
          </SelectTrigger>
          <SelectContent>
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SelectItem value="all">All software</SelectItem>
              {software.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </motion.div>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: 'created_at' | 'name') => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger 
              className="w-[140px] bg-background border-border/50 hover:bg-accent/5 transition-colors"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </motion.div>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleFilterChange('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-background border-border/50 hover:bg-accent/5 transition-all"
          >
            <motion.div
              animate={{ rotate: sortOrder === 'asc' ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowUpDown className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  router.push('/shop')
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
} 