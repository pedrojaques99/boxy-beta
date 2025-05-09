'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
      });
    }
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
          
          {/* Search Bar and Buttons */}
          <div className="flex items-center justify-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Input
                type="text"
                placeholder={t.shop.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 h-11 bg-background/50 backdrop-blur-sm border-border/50 hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 rounded-full"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </div>
            
            <Button onClick={handleSearch} size="icon" className="h-11 w-11 rounded-full">
              <Search className="h-4 w-4" />
            </Button>

            <Link href="/shop">
              <Button size="lg" variant="outline" className="gap-2 min-w-[120px]">
                {t.navigation.shop} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 