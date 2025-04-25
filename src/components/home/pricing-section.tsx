'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import Link from 'next/link';

export function PricingSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Tenha muito mais, gastando muito menos</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano perfeito para suas necessidades. Todos os planos incluem acesso aos recursos principais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-border h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <CardDescription>Perfeito para começar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Recursos básicos
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Suporte da comunidade
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Armazenamento limitado
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-primary h-full relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>Para usuários avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$37</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Todos os recursos gratuitos
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Suporte prioritário
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Recursos avançados
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Armazenamento ilimitado
                  </li>
                </ul>
                <Button className="w-full">
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-border h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>Para grandes organizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Personalizado</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Todos os recursos Pro
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Suporte dedicado
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Integrações personalizadas
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    Segurança avançada
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Fale Conosco
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 