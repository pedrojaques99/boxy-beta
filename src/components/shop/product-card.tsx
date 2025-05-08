'use client';

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Product } from '@/types'
import { LikeButton } from '@/components/LikeButton'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onFilterClick?: (key: 'type' | 'category' | 'software', value: string) => void
  isTagActive?: (key: 'type' | 'category' | 'software', value: string) => boolean
  showFooterLink?: boolean
  viewDetailsText?: string
  userId?: string | null
}

export function ProductCard({ 
  product, 
  onFilterClick, 
  isTagActive, 
  showFooterLink = true,
  viewDetailsText = "Ver detalhes",
  userId
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden group h-full relative">
      <div className="absolute top-4 right-4 z-10">
        <LikeButton type="product" id={product.id} userId={userId} />
      </div>

      {product.thumb && (
        <div className="relative w-full overflow-hidden bg-muted">
          <Link href={`/shop/${product.id}`} className="block">
            <img
              src={product.thumb}
              alt={product.name}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          {product.type && onFilterClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterClick('type', product.type!)}
              className={cn(
                "absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs transition-all",
                "border border-stone-300 dark:border-stone-600",
                "hover:border-stone-400 dark:hover:border-stone-500",
                "bg-background/80 backdrop-blur-sm",
                isTagActive && isTagActive('type', product.type)
                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 shadow-sm'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
              )}
            >
              {product.type}
            </motion.button>
          )}
        </div>
      )}
      
      <CardContent className="p-4">
        <Link href={`/shop/${product.id}`} className="block">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {product.name}
          </h2>
          {product.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </Link>

        {onFilterClick && (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.category && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterClick('category', product.category!)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-all",
                  "border border-stone-300 dark:border-stone-600",
                  "hover:border-stone-400 dark:hover:border-stone-500",
                  "bg-background/80 backdrop-blur-sm",
                  isTagActive && isTagActive('category', product.category)
                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 shadow-sm'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                )}
              >
                {product.category}
              </motion.button>
            )}
            {product.software && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterClick('software', product.software!)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-all",
                  "border border-stone-300 dark:border-stone-600",
                  "hover:border-stone-400 dark:hover:border-stone-500",
                  "bg-background/80 backdrop-blur-sm",
                  isTagActive && isTagActive('software', product.software)
                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 shadow-sm'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                )}
              >
                {product.software}
              </motion.button>
            )}
          </div>
        )}
      </CardContent>

      {showFooterLink && (
        <CardFooter className="p-4 pt-0">
          <Link href={`/shop/${product.id}`} className="block">
            <span className="text-sm font-medium text-primary group-hover:underline hover:pl-1 transition-all">
              {viewDetailsText}
            </span>
          </Link>
        </CardFooter>
      )}
    </Card>
  )
} 