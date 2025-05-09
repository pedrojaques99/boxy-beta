'use client';

import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export function AboutSection() {
  const { t } = useTranslations();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!sectionRef.current) return;
    
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e instanceof MouseEvent ? e.clientX - rect.left : e.clientX - rect.left;
    const y = e instanceof MouseEvent ? e.clientY - rect.top : e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (sectionElement) {
      sectionElement.addEventListener('mousemove', handleMouseMove);
      sectionElement.addEventListener('mouseenter', handleMouseEnter);
      sectionElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sectionElement) {
        sectionElement.removeEventListener('mousemove', handleMouseMove);
        sectionElement.removeEventListener('mouseenter', handleMouseEnter);
        sectionElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  if (!t) return null;

  const teamMembers = [
    { src: '/images/jacao.webp', alt: t.home.about.team.title },
    { src: '/images/davi.webp', alt: t.home.about.team.title },
    { src: '/images/pedro.webp', alt: t.home.about.team.title },
  ];

  return (
    <motion.section
      ref={sectionRef}
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-background to-primary/10",
        "py-20",
        "before:absolute before:inset-0",
        "before:bg-[linear-gradient(to_right,theme(colors.foreground/3)_0.5px,transparent_1px),linear-gradient(to_bottom,theme(colors.foreground/3)_0.5px,transparent_1px)]",
        "before:bg-[size:2rem_2rem]",
        "before:mask-image:[linear-gradient(to_bottom,transparent,black_10%,black_100%,transparent)]",
        "before:opacity-10"
      )}
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
          <h2 className="text-3xl font-bold mb-6">{t.home.about.title}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t.home.about.description}
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-4">
              {teamMembers.map((member, index) => (
                <motion.img
                  key={member.src}
                  src={member.src}
                  alt={member.alt}
                  className="w-20 h-20 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
} 