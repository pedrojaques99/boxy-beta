'use client';

import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';

export function AboutSection() {
  const { t } = useTranslations();

  if (!t) return null;

  const teamMembers = [
    { src: '/images/jacao.webp', alt: t.home.about.teamMember },
    { src: '/images/davi.webp', alt: t.home.about.teamMember },
    { src: '/images/pedro.webp', alt: t.home.about.teamMember },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
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
    </section>
  );
} 