'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PricingSection } from "@/components/home/pricing-section";

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
    <div className="min-h-screen relative z-10">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/images/boxy_3d_3_1.webp)',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Pricing Section */}
      <section className="relative py-20 z-20">
        <div className="container mx-auto px-4">
          <PricingSection />
        </div>
      </section>
    </div>
  );
} 