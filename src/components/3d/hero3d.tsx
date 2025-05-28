'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/use-media-query';

// Dynamic import with proper error handling
const Logo3D = dynamic(
  () => import('./logo3d').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="px-4 py-2 rounded-md bg-background/80 backdrop-blur-sm border border-border/50">
          <span className="text-sm text-foreground">Loading 3D viewer...</span>
        </div>
      </div>
    ),
  }
);

// This component will work by loading 3D components dynamically only on the client side
export default function Hero3D() {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-background" />
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]">
      <div className="absolute inset-0">
        <Logo3D isMobile={isMobile} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/30 to-background pointer-events-none z-[1]" />
    </div>
  );
}

