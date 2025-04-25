'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PricePage() {
  const { subscriptionType } = useSubscription();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Aqui você implementaria a lógica de pagamento
      // Após confirmação do pagamento, atualize o tipo de assinatura
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_type: 'premium' })
        .eq('id', user.id);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-4">
          Planos de Assinatura
        </h1>
        <p className="text-stone-600 dark:text-stone-300 max-w-2xl mx-auto">
          Escolha o plano perfeito para suas necessidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Plano Free */}
        <Card className={`border-2 ${subscriptionType === 'free' ? 'border-primary' : 'border-stone-200'} dark:border-stone-800`}>
          <CardHeader>
            <CardTitle className="text-2xl">Gratuito</CardTitle>
            <CardDescription>Perfeito para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">R$0</span>
              <span className="text-stone-500 dark:text-stone-400">/mês</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Acesso a produtos gratuitos
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Suporte da comunidade
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Recursos básicos
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={subscriptionType === 'free'}
            >
              Plano Atual
            </Button>
          </CardContent>
        </Card>

        {/* Plano Premium */}
        <Card className={`border-2 ${subscriptionType === 'premium' ? 'border-primary' : 'border-stone-200'} dark:border-stone-800 relative`}>
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
              Recomendado
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Para usuários avançados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">R$37</span>
              <span className="text-stone-500 dark:text-stone-400">/mês</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Tudo do plano gratuito
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Acesso a produtos premium
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Suporte prioritário
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Recursos avançados
              </li>
            </ul>
            <Button 
              className="w-full"
              onClick={handleUpgrade}
              disabled={subscriptionType === 'premium' || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : subscriptionType === 'premium' ? (
                'Plano Atual'
              ) : (
                'Assinar Agora'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 