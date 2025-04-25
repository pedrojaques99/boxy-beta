'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center bg-gradient-to-b from-background to-accent/5">
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-small" />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            A revolução criativa começou.
          </h1>
          <p className="text-xl text-muted-foreground">
            De criativo 👉 para criativo.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                Explore agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 