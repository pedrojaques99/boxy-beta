'use client';

import { useUser } from '@supabase/auth-helpers-react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function PriceLayout({ children }: PropsWithChildren) {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);

  // Only show the loading state briefly on initial load
  useEffect(() => {
    if (user !== null) {
      setIsLoading(false);
    }
    
    // Set a max timeout to avoid infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {children}
    </div>
  );
} 