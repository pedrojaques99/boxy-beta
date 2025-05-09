'use client';

import { Card } from "@/components/ui/card";
import { Sparkles, Box, Users } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';
import { useRef, useState, useEffect } from 'react';

export function FeaturesSection() {
  const { t } = useTranslations();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (!t) return null;

  const features = [
    {
      icon: Sparkles,
      title: t.home.features.items.premium.title,
      description: t.home.features.items.premium.description
    },
    {
      icon: Box,
      title: t.home.features.items.exclusive.title,
      description: t.home.features.items.exclusive.description
    },
    {
      icon: Users,
      title: t.home.features.items.community.title,
      description: t.home.features.items.community.description
    }
  ];

  return (
    <section className="py-20" ref={containerRef}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">{t.home.features.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.home.features.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-8 h-full bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
    </section>
  );
} 