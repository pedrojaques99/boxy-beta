'use client';

import { AboutHero } from '@/components/about/about-hero';
import { TeamSection } from '@/components/about/team-section';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from '@/hooks/use-translations';

export default function AboutPage() {
  const { t } = useTranslations();
  
  const teamMembers = [
    {
      name: 'Pedro Jaques',
      role: 'Designer & Empreendedor',
      description: 'Viciado em texturas e antiguidades, sócio criador da agência de branding Visant, atua como empreendedor, designer e pseudo artista desde 2017.',
      image: '/images/jacao.webp'
    },
    {
      name: 'Pedro Xavier',
      role: 'Designer & Empreendedor',
      description: 'Designer e empreendedor desde 2017, amante das artes desde 1998. Sócio criador da agência de branding e design Visant. Entusiasta em criar uma comunidade onde todos os designers evoluem juntos.',
      image: '/images/pedro.webp'
    },
    {
      name: 'Davi Alves',
      role: 'Designer & Empreendedor',
      description: 'Designer desde 2014, empreendedor desde 2019, está a frente de uma das maiores agências de design e criação de conteúdos do Brasil.',
      image: '/images/davi.webp'
    },
  ];

  if (!t) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <AboutHero
        title={t.home.about.title}
        description={t.home.about.description}
        subtitle={t.home.about.subtitle}
      />

      <TeamSection
        title={t.home.about.team.title}
        subtitle={t.home.about.team.subtitle}
        members={teamMembers}
      />

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6">{t.home.about.cta.title}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.home.about.cta.description}
            </p>
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                {t.home.about.cta.button}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 