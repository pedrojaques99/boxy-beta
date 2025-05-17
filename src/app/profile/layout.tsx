'use client';

import { useAuth } from '@/hooks/use-auth';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileLayout({ children }: PropsWithChildren) {
  const { user, loading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?redirectTo=/profile');
      return;
    }
    
    if (!loading) {
      setIsLoading(false);
    }
    
    // Set a max timeout to avoid infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [loading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {children}
    </div>
  );
} 