'use client';

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onFilterClick?: (key: 'type' | 'category' | 'software', value: string) => void
  isTagActive?: (key: 'type' | 'category' | 'software', value: string) => boolean
  showFooterLink?: boolean
  viewDetailsText?: string
}

export function ProductCard({ 
  product, 
  onFilterClick, 
  isTagActive, 
  showFooterLink = true,
  viewDetailsText = "Ver detalhes" 
}: ProductCardProps) {
  return (
    <Link href={`/shop/${product.id}`} className="block">
      <Card className="overflow-hidden group h-full">
        {product.thumb && (
          <div className="relative w-full overflow-hidden bg-muted">
            <img
              src={product.thumb}
              alt={product.name}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {product.type && onFilterClick && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 1 }}
                onClick={(e) => {
                  e.preventDefault()
                  onFilterClick('type', product.type!)
                }}
                className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm transition-all ${
                  isTagActive && isTagActive('type', product.type)
                    ? 'bg-primary/20 text-primary-foreground shadow-md text-xs'
                    : 'bg-background/20 border border-primary/20 text-primary hover:bg-primary/10 text-xs'
                }`}
              >
                {product.type}
              </motion.button>
            )}
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {product.name}
            </h2>
          </div>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          {onFilterClick && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.category && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 1 }}
                  onClick={(e) => {
                    e.preventDefault()
                    onFilterClick('category', product.category!)
                  }}
                  className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                    isTagActive && isTagActive('category', product.category)
                      ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                      : 'bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground hover:bg-secondary/20 dark:hover:bg-secondary/30 text-xs'
                  }`}
                >
                  {product.category}
                </motion.button>
              )}
              {product.software && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 1 }}
                  onClick={(e) => {
                    e.preventDefault()
                    onFilterClick('software', product.software!)
                  }}
                  className={`rounded-full px-2 py-1 text-xs transition-all border border-stone-800 hover:border-stone-600 ${
                    isTagActive && isTagActive('software', product.software)
                      ? 'bg-secondary text-secondary-foreground shadow-md text-xs'
                      : 'bg-background border border-secondary text-secondary-foreground hover:bg-secondary/10 text-xs'
                  }`}
                >
                  {product.software}
                </motion.button>
              )}
            </div>
          )}
        </CardContent>

        {showFooterLink && (
          <CardFooter className="p-4 pt-0">
            <span className="text-sm font-medium text-primary group-hover:underline text-xs hover:pl-1 transition-all">
              {viewDetailsText}
            </span>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
} 