'use client';

import { getAuthService } from '@/lib/auth/auth-service';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { PricingSection } from '@/components/home/pricing-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { LatestProductsSection } from '@/components/home/latest-products-section';
import { useTranslations } from '@/hooks/use-translations';
import { AboutSection } from '@/components/home/about-section';
import { FaqSection } from '@/components/home/faq-section';
import { createClient } from '@/lib/supabase/client';

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

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const authService = getAuthService();
  const { t } = useTranslations();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (productsError) {
          console.error('Error fetching products:', productsError);
          return;
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('products')
          .select('category')
          .not('category', 'is', null);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          return;
        }

        if (products) setLatestProducts(products);
        if (categoriesData) {
          const uniqueCategories = [...new Set(categoriesData.map((item: { category: string }) => item.category))] as string[];
          if (!uniqueCategories.includes('Freebies')) {
            uniqueCategories.push('Freebies');
          }
          if (!uniqueCategories.includes('Tools')) {
            uniqueCategories.push('Tools');
          }
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  if (!t) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <CategoriesSection categories={categories} />

      <section className="relative py-20 bg-neutral-950">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/images/about-bg.webp)' }}
        />
        <div className="w-[90%] mx-auto relative z-10">
          <FeaturesSection />
        </div>
      </section>

      <LatestProductsSection products={latestProducts} />

      {/* Who We Are Section */}
      <AboutSection />

      <PricingSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Roadmap Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">{t.home.roadmap.title}</h2>
            <div className="space-y-6">
              {Object.entries(t.home.roadmap.items).map(([key, item], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{item.quarter}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Discord Join Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">{t.home.community.title}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.home.community.description}
            </p>
            <Button size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              {t.home.community.joinDiscord}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
