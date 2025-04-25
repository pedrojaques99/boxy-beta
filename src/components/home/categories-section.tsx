'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface CategoriesSectionProps {
  categories: string[];
}

const categoryImages = {
  '3D': '/images/categories/3d.jpg',
  'Texturas': '/images/categories/textures.jpg',
  'Modelos': '/images/categories/models.jpg',
  'Materiais': '/images/categories/materials.jpg',
  'HDRIs': '/images/categories/hdris.jpg',
  'Plugins': '/images/categories/plugins.jpg',
  'default': '/images/categories/default.jpg'
};

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Categorias</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore nossa seleção de recursos organizados por categoria
          </p>
        </motion.div>

        <div className="w-[80%] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {categories.map((category, index) => {
            const imageUrl = categoryImages[category as keyof typeof categoryImages] || categoryImages.default;
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/shop?category=${category}`}>
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="relative h-48 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
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
                          {category}
                        </h3>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Descubra recursos exclusivos para {category.toLowerCase()}
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