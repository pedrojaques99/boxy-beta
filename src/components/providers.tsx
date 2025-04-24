'use client';

import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="top-center" />
    </ThemeProvider>
  );
} 