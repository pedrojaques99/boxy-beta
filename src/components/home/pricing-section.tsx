'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

export function PricingSection() {
  const { t } = useTranslations();

  if (!t?.home?.pricing?.plans) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            {t.home.pricing.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.home.pricing.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pt-4"
          >
            <Card className="h-full border-2 border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2">{t.home.pricing.plans.free.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold">{t.home.pricing.plans.free.price}</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {t.home.pricing.plans.free.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    {t.home.pricing.plans.free.button}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <Card className="h-full border-2 border-primary relative overflow-hidden">
              <div className="absolute -top-4 right-6 bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full font-medium shadow-lg">
                +12% OFF
              </div>
              <CardContent className="p-8">
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2">{t.home.pricing.plans.annual.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t.home.pricing.plans.annual.monthly}
                  </p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold">{t.home.pricing.plans.annual.price}</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {t.home.pricing.plans.annual.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full">
                    {t.home.pricing.plans.annual.button}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            <Card className="h-full border-2 border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2">{t.home.pricing.plans.monthly.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t.home.pricing.plans.monthly.monthly}
                  </p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold">{t.home.pricing.plans.monthly.price}</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {t.home.pricing.plans.monthly.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    {t.home.pricing.plans.monthly.button}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 