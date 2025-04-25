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

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <CategoriesSection categories={categories} />

      <section className="py-20 bg-neutral-950">
        <div className="w-[90%] mx-auto">
          <FeaturesSection />
        </div>
      </section>

      {/* Latest Products Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12 w-[90%] mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold">Últimos Lançamentos</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/shop">
                <Button variant="outline" className="gap-2">
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-[90%] mx-auto">
            {latestProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard 
                  product={product}
                  showFooterLink={true}
                  viewDetailsText="Ver detalhes"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">A BOXY</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Somos uma plataforma dedicada a conectar criativos com as melhores ferramentas e recursos.
              Nossa missão é impulsionar a criatividade e facilitar o processo criativo.
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/avatar1.jpg"
                  alt="Team member"
                  className="w-10 h-10 rounded-full"
                />
                <img
                  src="/avatar2.jpg"
                  alt="Team member"
                  className="w-10 h-10 rounded-full"
                />
                <img
                  src="/avatar3.jpg"
                  alt="Team member"
                  className="w-10 h-10 rounded-full"
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
            <h2 className="text-3xl font-bold mb-12 text-center">FAQ</h2>
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Como funciona a BOXY?</h3>
                <p className="text-muted-foreground">
                  A BOXY é uma plataforma que conecta criativos com recursos e ferramentas de alta qualidade.
                  Você pode explorar, baixar e utilizar os recursos disponíveis em sua jornada criativa.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Quais são os métodos de pagamento?</h3>
                <p className="text-muted-foreground">
                  Aceitamos diversos métodos de pagamento, incluindo cartões de crédito, débito e PIX.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Posso cancelar minha assinatura?</h3>
                <p className="text-muted-foreground">
                  Sim, você pode cancelar sua assinatura a qualquer momento, sem taxas adicionais.
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
            <h2 className="text-3xl font-bold mb-12 text-center">O que esperar da BOXY?</h2>
            <div className="space-y-6">
              {[
                {
                  quarter: "Q1",
                  title: "Lançamento da Plataforma",
                  description: "Início das operações e primeiros recursos"
                },
                {
                  quarter: "Q2",
                  title: "Expansão de Recursos",
                  description: "Novas categorias e ferramentas"
                },
                {
                  quarter: "Q3",
                  title: "Comunidade e Colaboração",
                  description: "Recursos de interação entre usuários"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.quarter}
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
            <h2 className="text-3xl font-bold mb-6">Junte-se à nossa comunidade</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Conecte-se com outros criativos, compartilhe experiências e fique por dentro das novidades.
            </p>
            <Button size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Entrar no Discord
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">BOXY</h3>
              <p className="text-sm text-muted-foreground">
                Transformando a maneira como os criativos trabalham.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/shop" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Explorar
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Preços
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/discord" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Comunidade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} BOXY. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
