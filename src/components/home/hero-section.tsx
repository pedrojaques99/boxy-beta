'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslations } from '@/hooks/use-translations';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslations();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, []);

  if (!t) return null;

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <div className="w-[80%] h-[80%] relative">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => console.error('Video error:', e)}
          >
            <source src="/images/boxy_mp4.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/90" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            {t.home.hero.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.home.hero.subtitle}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                {t.navigation.shop} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 