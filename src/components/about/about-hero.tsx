'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface AboutHeroProps {
  title: string;
  description: string;
  subtitle?: string;
}

export function AboutHero({ title, description, subtitle }: AboutHeroProps) {
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
        "py-20 flex items-center justify-center",
        "before:absolute before:inset-0",
        "before:bg-[linear-gradient(to_right,theme(colors.foreground/3)_0.5px,transparent_1px),linear-gradient(to_bottom,theme(colors.foreground/3)_0.5px,transparent_1px)]",
        "before:bg-[size:2rem_2rem]",
        "before:mask-image:[linear-gradient(to_bottom,transparent,black_10%,black_100%,transparent)]",
        "before:opacity-10"
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
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">{title}</h1>
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
    </motion.div>
  );
} 