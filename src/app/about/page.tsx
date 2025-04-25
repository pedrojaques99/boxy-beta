'use client';

import { AboutHero } from '@/components/about/about-hero';
import { TeamSection } from '@/components/about/team-section';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutPage() {
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

  return (
    <div className="flex flex-col min-h-screen">
      <AboutHero
        title="Sobre a BOXY®"
        description="Da junção de 3 designers apaixonados pelo o que fazem, nasceu a BOXY®. Nossa missão sempre foi grandiosa – transformar a rotina do designer brasileiro em algo extraordinário."
        subtitle="Com uma produção de mockups, templates, ferramentas e cursos 100% brasileira, temos o orgulho de dizer que seremos o maior projeto de assets para designers brasileiros!"
      />

      <TeamSection
        title="Nossa Equipe"
        subtitle="Conheça os criadores por trás da BOXY®"
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
            <h2 className="text-3xl font-bold mb-6">Junte-se à nossa comunidade</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Faça parte da maior comunidade de designers brasileiros e tenha acesso a recursos exclusivos.
            </p>
            <Link href="/shop">
              <Button size="lg" className="gap-2">
                Explorar Produtos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 