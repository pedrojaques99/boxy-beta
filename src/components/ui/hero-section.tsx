'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  className?: string;
  pattern?: 'grid' | 'none';
}

export function HeroSection({ title, subtitle, className, pattern = 'none' }: HeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!heroRef.current) return;
    
    const rect = heroRef.current.getBoundingClientRect();
    const x = e instanceof MouseEvent ? e.clientX - rect.left : e.clientX - rect.left;
    const y = e instanceof MouseEvent ? e.clientY - rect.top : e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  useEffect(() => {
    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
      heroElement.addEventListener('mouseenter', handleMouseEnter);
      heroElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove);
        heroElement.removeEventListener('mouseenter', handleMouseEnter);
        heroElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <motion.div
      ref={heroRef}
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-background to-primary/10",
        "min-h-[30vh] md:min-h-[40vh] flex items-center justify-center",
        pattern === 'grid' && [
          "before:absolute before:inset-0",
          "before:bg-[linear-gradient(to_right,theme(colors.foreground/3)_0.5px,transparent_1px),linear-gradient(to_bottom,theme(colors.foreground/3)_0.5px,transparent_1px)]",
          "before:bg-[size:2rem_2rem]",
          "before:mask-image:[linear-gradient(to_bottom,transparent,black_10%,black_100%,transparent)]",
          "before:opacity-10"
        ],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      
      {/* Secondary spotlight effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        style={{
          background: `
            radial-gradient(
              900px circle at ${mousePosition.x}px ${mousePosition.y}px,
              rgba(var(--primary-rgb), 0.1),
              transparent 20%
            )
          `
        }}
      />
      
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {title}
        </motion.h1>
        
        {subtitle && (
          <motion.p
            className="mt-4 text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
} 