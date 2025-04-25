'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/shop/product-card';
import { useTranslations } from '@/hooks/use-translations';

interface Product {
  id: string;
  name: string;
  description: string;
  thumb: string;
  category: string;
  type: string | null;
  software: string | null;
  file_url: string | null;
  tags: string[] | null;
  created_at: string;
}

interface LatestProductsSectionProps {
  products: Product[];
}

export function LatestProductsSection({ products }: LatestProductsSectionProps) {
  const { t } = useTranslations();

  if (!t) return null;

  return (
    <section className="py-20 w-[90%] mx-auto">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12 w-[90%] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold">{t.home.latestProducts.title}</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/shop">
              <Button variant="outline" className="gap-2">
                {t.home.latestProducts.viewAll} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-[90%] mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard 
                product={product}
                showFooterLink={true}
                viewDetailsText={t.shop.viewDetails}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 