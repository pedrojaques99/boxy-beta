'use client';

import { CheckoutWizard } from '@/components/checkout/CheckoutWizard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlanId, PLANS } from '@/lib/plans';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthService } from '@/lib/auth/auth-service';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const authService = getAuthService();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verify authentication using AuthService
        const { data: { session }, error: sessionError } = await authService.getSession();
        
        if (sessionError || !session) {
          console.error('Erro de autenticação:', sessionError);
          toast.error('Por favor, faça login para continuar');
          authService.redirectToAuthPage(router, `/checkout/${params.plan}`, 'login_required');
          return;
        }
        
        setIsAuthenticated(true);
        
        // Validate plan ID from URL
        const plan = params.plan as string;
        if (!plan || !Object.keys(PLANS).includes(plan)) {
          console.error('Plano inválido:', plan);
          toast.error('Plano inválido');
          router.push('/price');
          return;
        }
        
        setPlanId(plan as PlanId);
        
        // Get user data to check subscription
        const { data: { user }, error: userError } = await authService.getUser();
        
        if (userError || !user?.id) {
          console.error('Erro ao buscar dados do usuário:', userError);
          toast.error('Erro ao carregar dados do usuário');
          authService.redirectToAuthPage(router, `/checkout/${params.plan}`, 'user_error');
          return;
        }
        
        // Check if user already has a subscription
        const subscription = await authService.getUserSubscription(user.id);
        
        if (subscription) {
          console.log('Usuário já possui assinatura ativa:', subscription);
          toast.info('Você já possui uma assinatura ativa');
          router.push('/profile');
          return;
        }
        
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        toast.error('Erro ao verificar autenticação');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [params.plan, router, authService]);

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
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-muted/10 px-2 sm:px-4 md:px-6 py-4 sm:py-8">
      <div className="w-full max-w-md sm:max-w-2xl">
        <CheckoutWizard defaultPlanId={planId ?? undefined} />
      </div>
    </div>
  );
} 