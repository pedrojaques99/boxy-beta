'use client';

import { Card } from "@/components/ui/card";
import { Sparkles, Box, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "Qualidade Premium",
      description: "Recursos e ferramentas de alta qualidade para impulsionar sua criatividade."
    },
    {
      icon: Box,
      title: "Recursos Exclusivos",
      description: "Acesso a conteúdo exclusivo e ferramentas especializadas."
    },
    {
      icon: Users,
      title: "Comunidade Ativa",
      description: "Conecte-se com outros criativos e compartilhe experiências."
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Feito para Você</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubra todas as ferramentas e recursos que preparamos especialmente para você.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full">
                <feature.icon className="h-8 w-8 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 