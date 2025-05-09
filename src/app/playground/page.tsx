'use client';

import { RealtimeCursors } from '@/components/realtime-cursors';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAuthService } from '@/lib/auth/auth-service';
import { useUser } from '@supabase/auth-helpers-react';
import { useTranslations } from '@/hooks/use-translations';
import { toast } from 'sonner';

export default function PlaygroundPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const user = useUser();
  const authService = getAuthService();
  const { t } = useTranslations();

  useEffect(() => {
    const setupUser = async () => {
      try {
        setIsLoading(true);
        // If user is authenticated, use their email username
        if (user?.email) {
          setUsername(user.email.split('@')[0]);
        } else {
          // Generate a random username for demo purposes
          const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
          setUsername(randomUsername);
        }
      } catch (error) {
        console.error('Error setting up user:', error);
        toast.error('Failed to setup user. Using temporary username.');
        // Fallback to random username
        const randomUsername = `user_${Math.random().toString(36).substring(2, 8)}`;
        setUsername(randomUsername);
      } finally {
        setIsLoading(false);
      }
    };

    setupUser();
  }, [user]);

  if (!t) return null;

  return (
    <div className="relative min-h-screen w-full">
      {/* RealtimeCursors component - positioned absolutely to cover entire viewport */}
      {username && !isLoading && (
        <div className="fixed inset-0 pointer-events-none">
          <RealtimeCursors
            roomName="playground"
            username={username}
          />
        </div>
      )}
      
      {/* Main content - cursor hidden in this area */}
      <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background to-primary/10 cursor-none">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground cursor-none">
          👀
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground cursor-none">Loading...</p>
          ) : (
            <p className="text-sm text-primary/20 cursor-none hover:text-primary/40 transition-all duration-300">
              Estou vendo um tal de: {username}
            </p>
          )}
        </div>
      </main>
    </div>
  );
} 