import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

interface FilterOptions {
  category: string[]
  subcategory: string[]
  software: string[]
}

interface FilterLabels {
  category: string
  subcategory: string
  software: string
}

interface FilterMenuProps {
  options: FilterOptions
  labels: FilterLabels
}

export function FilterMenu({ options, labels }: FilterMenuProps) {
  const [filters, setFilters] = useState<Record<string, string[]>>({
    category: [],
    subcategory: [],
    software: [],
  })

  const handleFilterChange = (type: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{labels.category}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {options.category.map(category => (
            <DropdownMenuCheckboxItem
              key={category}
              checked={filters.category.includes(category)}
              onCheckedChange={() => handleFilterChange('category', category)}
            >
              {category}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{labels.subcategory}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {options.subcategory.map(subcategory => (
            <DropdownMenuCheckboxItem
              key={subcategory}
              checked={filters.subcategory.includes(subcategory)}
              onCheckedChange={() => handleFilterChange('subcategory', subcategory)}
            >
              {subcategory}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{labels.software}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {options.software.map(software => (
            <DropdownMenuCheckboxItem
              key={software}
              checked={filters.software.includes(software)}
              onCheckedChange={() => handleFilterChange('software', software)}
            >
              {software}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 