'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import type { Dictionary } from '@/i18n/types';

interface CategoriesSectionProps {
  categories: string[];
}

const categoryImages: Record<string, string> = {
  'modelos': '/images/categories/modelos.webp',
  'png': '/images/categories/png.webp',
  'texturas': '/images/categories/texturas.webp',
  'mockups': '/images/categories/mockups.webp',
  'free': '/images/categories/freebie.webp',
  'tools': '/images/categories/tools.png',
  'default': '/images/categories/modelos.webp'
};

const getCategoryTranslation = (category: string, t: Dictionary) => {
  const categoryLower = category.toLowerCase();
  switch (categoryLower) {
    case 'modelos':
      return t.shop.filters.models;
    case 'png':
      return 'PNG';
    case 'texturas':
      return t.shop.filters.textures;
    case 'mockups':
      return 'Mockups';
    case 'free':
    case 'freebie':
    case 'freebies':
      return t.shop.filters.free;
    case 'tools':
      return t.shop.filters.tools;
    default:
      return category;
  }
};

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const { t } = useTranslations();

  if (!t) return null;

  // Normalize categories to match our expected format
  const normalizedCategories = categories.map(category => {
    const lower = category.toLowerCase();
    // Handle special cases
    if (lower === 'mockup') return 'mockups';
    if (lower === 'modelo') return 'modelos';
    if (lower === 'freebie' || lower === 'freebies') return 'free';
    if (lower === 'tool') return 'tools';
    return category;
  });

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">{t.home.categories.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.home.categories.subtitle}
          </p>
        </motion.div>

        <div className="w-[80%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {normalizedCategories.map((category, index) => {
            const categoryLower = category.toLowerCase();
            const imageUrl = categoryImages[categoryLower] || categoryImages.default;
            const translatedCategory = getCategoryTranslation(category, t);
            const categoryForUrl = encodeURIComponent(category);
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/shop?category=${categoryForUrl}`}>
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                        style={{ 
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {translatedCategory}
                        </h3>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t.home.categories.discover.replace('{category}', (translatedCategory || category).toLowerCase())}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 