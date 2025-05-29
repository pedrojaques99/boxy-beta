'use client';

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Product } from '@/types'
import { LikeButton } from '@/components/LikeButton'
import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
import Image from 'next/image'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useState, useCallback, useRef } from 'react'

interface ProductCardProps {
  product: Product
  onFilterClick?: (key: 'type' | 'category' | 'software', value: string) => void
  isTagActive?: (key: 'type' | 'category' | 'software', value: string) => boolean
  showFooterLink?: boolean
  viewDetailsText?: string
  userId?: string | null
}

const softwareIcons: Record<string, string> = {
  'Photoshop': '/icons/photoshop-icon.svg',
  'Figma': '/icons/figma-icon.svg',
  'Illustrator': '/icons/illustrator-icon.svg',
  'After Effects': '/icons/ae-icon.svg',
  'Premiere': '/icons/premiere-icon.svg',
  'Blender': '/icons/blender-icon.svg'
}

export function ProductCard({ 
  product, 
  onFilterClick, 
  isTagActive, 
  showFooterLink = true,
  viewDetailsText = "Ver detalhes",
  userId
}: ProductCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [origin, setOrigin] = useState('center center');
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovering) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [isHovering]);

  const handleMouseLeave = () => setOrigin('center center');

  return (
    <Card 
      className={cn(
        "overflow-hidden group h-full relative transition-all duration-300",
        "before:absolute before:inset-0 before:p-[1px] before:rounded-lg before:content-[''] before:pointer-events-none",
        isHovering && "before:bg-[radial-gradient(800px_circle_at_var(--xPos)_var(--yPos),rgba(var(--primary),0.15),transparent_40%)]"
      )}
      style={{
        '--xPos': `${position.x}px`,
        '--yPos': `${position.y}px`
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      onHoverScale={isHovering ? 1.05 : 1}
    >
      <div className="absolute top-4 right-4 z-10">
        <LikeButton type="product" id={product.id} userId={userId} />
      </div>

      {product.thumb && (
        <div className="relative w-full overflow-hidden bg-muted">
          <Link href={`/shop/${product.id}`} className="block">
            <img
              ref={imgRef}
              src={product.thumb}
              alt={product.name}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transformOrigin: origin,
              }}
              className="w-full h-auto object-cover transition-all duration-300"
            />
          </Link>
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {product.software && onFilterClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onFilterClick('software', product.software!)}
                    className={cn(
                      "p-1.5 rounded-full transition-all",
                      "bg-background/10 backdrop-blur-sm border border-stone-500/50",
                      isTagActive && isTagActive('software', product.software)
                        ? 'bg-stone-100 dark:bg-stone-800 shadow-sm'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    )}
                  >
                    {softwareIcons[product.software] ? (
                      <Image 
                        src={softwareIcons[product.software]} 
                        alt={product.software}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    ) : (
                      <span className="text-xs px-1">{product.software}</span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{product.software}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {product.type && onFilterClick && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFilterClick('type', product.type!)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs transition-all",
                  "border border-stone-500/50",
                  "hover:border-stone-400 dark:hover:border-stone-500",
                  "bg-background/10 backdrop-blur-sm",
                  isTagActive && isTagActive('type', product.type)
                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 dark:border-stone-500 shadow-sm'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                )}
              >
                {product.type}
              </motion.button>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <Link href={`/shop/${product.id}`} className="block">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {product.name}
          </h2>
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {product.category && onFilterClick && (
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
          </div>
          {showFooterLink && (
            <Link href={`/shop/${product.id}`}>
              <span className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 hover:translate-x-1 transition-all">
                {viewDetailsText}
                <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
              </span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 