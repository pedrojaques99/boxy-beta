'use client'

import { useState, useEffect } from 'react'
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
import { useSearchParams } from 'next/navigation'

interface FilterMenuProps {
  onFilterChange: (filters: {
    category: string | null
    software: string | null
    sortBy: 'created_at' | 'name'
    sortOrder: 'asc' | 'desc'
    isFree: boolean
  }) => void
  categories: string[]
  software: string[]
  isFree: boolean
}

export function FilterMenu({ onFilterChange, categories, software, isFree }: FilterMenuProps) {
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') as string | null,
    software: searchParams.get('software') as string | null,
    sortBy: 'created_at' as 'created_at' | 'name',
    sortOrder: 'desc' as 'asc' | 'desc',
    isFree: isFree
  })

  // Sync isFree prop with local state
  useEffect(() => {
    setFilters(prev => ({ ...prev, isFree }))
  }, [isFree])

  // Sync URL parameters with local state
  useEffect(() => {
    const category = searchParams.get('category')
    const software = searchParams.get('software')
    const isFree = searchParams.get('free') === 'true'

    setFilters(prev => ({
      ...prev,
      category,
      software,
      isFree
    }))
  }, [searchParams])

  const handleFilterChange = (key: keyof typeof filters, value: string | null | boolean) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const hasActiveFilters = filters.category || filters.software || filters.sortBy !== 'created_at' || filters.isFree

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
            checked={filters.isFree}
            onCheckedChange={(checked) => handleFilterChange('isFree', checked === true)}
            className="border-border/50"
          />
          <Label htmlFor="free-filter" className="text-sm font-medium text-muted-foreground hover:cursor-pointer">
            Freebies
          </Label>
        </div>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value: string) => handleFilterChange('category', value === 'all' ? null : value)}
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
          value={filters.software || 'all'}
          onValueChange={(value: string) => handleFilterChange('software', value === 'all' ? null : value)}
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
            value={filters.sortBy}
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
            onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-background border-border/50 hover:bg-accent/5 transition-all"
          >
            <motion.div
              animate={{ rotate: filters.sortOrder === 'asc' ? 0 : 180 }}
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
                  setFilters({
                    category: null,
                    software: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    isFree: false
                  })
                  onFilterChange({
                    category: null,
                    software: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc',
                    isFree: false
                  })
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