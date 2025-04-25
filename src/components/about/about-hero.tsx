'use client';

import { motion } from 'framer-motion';

interface AboutHeroProps {
  title: string;
  description: string;
  subtitle?: string;
}

export function AboutHero({ title, description, subtitle }: AboutHeroProps) {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold mb-6">{title}</h1>
          <p className="text-lg text-muted-foreground mb-4">
            {description}
          </p>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
} 