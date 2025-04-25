'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { PricingSection } from '@/components/home/pricing-section';
import { ProductCard } from '@/components/shop/product-card';
import { CategoriesSection } from '@/components/home/categories-section';
import { LatestProductsSection } from '@/components/home/latest-products-section';
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

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { t } = useTranslations();

  useEffect(() => {
    const fetchData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      const { data: categoriesData } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (products) setLatestProducts(products);
      if (categoriesData) {
        const uniqueCategories = [...new Set(categoriesData.map(item => item.category))];
        setCategories(uniqueCategories);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (!t) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <CategoriesSection categories={categories} />

      <section className="py-20 bg-neutral-950">
        <div className="w-[90%] mx-auto">
          <FeaturesSection />
        </div>
      </section>

      <LatestProductsSection products={latestProducts} />

      {/* Who We Are Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">{t.home.about.title}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.home.about.description}
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="/images/jacao.webp"
                  alt={t.home.about.teamMember}
                  className="w-20 h-20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                />
                <img
                  src="/images/davi.webp"
                  alt={t.home.about.teamMember}
                  className="w-20 h-20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                />
                <img
                  src="/images/pedro.webp"
                  alt={t.home.about.teamMember}
                  className="w-20 h-20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-12 text-center">{t.home.faq.title}</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">{t.home.faq.items.howItWorks.question}</h3>
                <p className="text-muted-foreground">
                  {t.home.faq.items.howItWorks.answer}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">{t.home.faq.items.paymentMethods.question}</h3>
                <p className="text-muted-foreground">
                  {t.home.faq.items.paymentMethods.answer}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">{t.home.faq.items.subscription.question}</h3>
                <p className="text-muted-foreground">
                  {t.home.faq.items.subscription.answer}
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

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
                  transition={{ delay: index * 0.1 }}
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

      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t.footer.brand.title}</h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.brand.description}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer.products.title}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.products.explore}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.products.pricing}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer.resources.title}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.resources.blog}
                  </Link>
                </li>
                <li>
                  <Link href="/discord" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.resources.community}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal.title}</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.legal.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t.footer.legal.terms}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>{t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
