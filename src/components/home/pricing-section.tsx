'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

export function PricingSection() {
  const { t } = useTranslations();

  if (!t?.home?.pricing?.plans) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">{t.home.pricing.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.home.pricing.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-border/50 hover:border-primary/20 transition-colors h-full">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold">R$ 00</span>
                  <span className="text-2xl">,00</span>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Acesso aos produtos gratuitos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Acesso a comunidade (em breve)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Recursos básicos
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Ver Freebies
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-primary h-full relative">
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
                +12% OFF
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">Boxer anual</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  equivalente a 33,16/mês
                </p>
                <div className="flex items-baseline mb-6">
                  <span className="text-sm mr-1">R$</span>
                  <span className="text-5xl font-bold">397</span>
                  <span className="text-2xl">,92</span>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Acesso total da loja
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Sem limite de download
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Comunidade (em breve)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Novos produtos todo mês
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Economize R$ 57 anual
                  </li>
                </ul>
                <Button className="w-full">
                  Seja um Boxer
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border border-border/50 hover:border-primary/20 transition-colors h-full">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">Boxer mensal</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Cobrado mensalmente
                </p>
                <div className="flex items-baseline mb-6">
                  <span className="text-sm mr-1">R$</span>
                  <span className="text-5xl font-bold">37</span>
                  <span className="text-2xl">,90</span>
                </div>
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Acesso por 30 dias
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    10x downloads por dia
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Comunidade (em breve)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Novos produtos todo mês
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Seja um Boxer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 