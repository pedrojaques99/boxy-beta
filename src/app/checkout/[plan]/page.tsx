'use client';

import { CheckoutWizard } from '@/components/checkout/CheckoutWizard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlanId, PLANS } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verify session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Erro na verificação de sessão:', error);
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        
        setIsAuthenticated(true);
        
        // Validate plan ID from URL
        const plan = params.plan as string;
        if (!plan || !Object.keys(PLANS).includes(plan)) {
          console.error('Plano inválido:', plan);
          router.push('/price');
          return;
        }
        
        setPlanId(plan as PlanId);
        
        // Check if user already has a subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();
          
        if (subscription && !subError) {
          console.log('Usuário já possui assinatura ativa:', subscription);
          router.push('/profile');
          return;
        }
        
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [params.plan, router, supabase]);

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center min-h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !planId) {
    return null; // This will be handled by the redirects in useEffect
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/price" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Planos
        </Link>
      </div>
      
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Finalizar Assinatura</h1>
        <CheckoutWizard 
          defaultPlanId={planId} 
          onSuccess={() => {
            router.push('/dashboard?subscription=success');
          }} 
        />
      </Card>
    </div>
  );
} 