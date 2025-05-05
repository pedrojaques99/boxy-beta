'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion";
import { useTranslations } from '@/hooks/use-translations';
import { i18n } from '@/i18n/settings';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { handleError } from '@/lib/error-handler';
import { getAuthService } from '@/lib/auth/auth-service';

type UserStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [userName, setUserName] = useState<string | null>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [themeState, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'; // Default to light theme during SSR
    }
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });
  const authService = getAuthService();
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslations();

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          const { data } = await authService.getUser();
          setUserName(data.user?.email?.split('@')[0] || 'User');
          setUserStatus('authenticated');
        } else {
          setUserStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUserStatus('unauthenticated');
      }
    };

    checkAuth();
  }, [authService]);

  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setThemeState(systemTheme);
    } else {
      setThemeState(theme);
    }
  }, [theme]);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push('/');
  };

  const toggleLanguage = async () => {
    if (isLanguageChanging) return;
    
    setIsLanguageChanging(true);
    try {
      const newLocale = locale === 'en' ? 'pt-BR' : 'en';
      localStorage.setItem('locale', newLocale);
      window.location.reload();
    } catch (error) {
      const { error: errorMessage } = handleError(error, 'Error changing language');
      console.error(errorMessage);
    } finally {
      setIsLanguageChanging(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = themeState === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    setTheme(newTheme);
  };

  if (!t) return null;

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm",
      "dark:border-border/40 dark:bg-background/80"
    )}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <motion.div
              className="h-7 w-auto"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Image 
                src="/logo/boxy-logotype-green.svg"
                alt="BOXY Logo"
                width={100}
                height={22}
                priority
              />
            </motion.div>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/about"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "text-foreground/60 hover:text-foreground/80",
                "dark:text-foreground/60 dark:hover:text-foreground/80",
                pathname === "/about" && "text-foreground dark:text-foreground font-medium"
              )}
            >
              {t.navigation?.about}
            </Link>
            <Link
              href="/shop"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "text-foreground/60 hover:text-foreground/80",
                "dark:text-foreground/60 dark:hover:text-foreground/80",
                pathname === "/shop" && "text-foreground dark:text-foreground font-medium"
              )}
            >
              {t.navigation?.shop}
            </Link>
            <Link
              href="/labs"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "text-foreground/60 hover:text-foreground/80",
                "dark:text-foreground/60 dark:hover:text-foreground/80",
                pathname === "/labs" && "text-foreground dark:text-foreground font-medium"
              )}
            >
              {t.navigation?.labs}
            </Link>
            <Link
              href="/price"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                "text-foreground/60 hover:text-foreground/80",
                "dark:text-foreground/60 dark:hover:text-foreground/80",
                pathname === "/price" && "text-foreground dark:text-foreground font-medium"
              )}
            >
              {t.navigation?.pricing}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Language and Theme Switchers */}
          <div className="flex items-center space-x-2 mr-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLanguage}
                  disabled={isLanguageChanging}
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground relative group",
                    isLanguageChanging && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Image
                    src={locale === 'pt-BR' 
                      ? "/icons/emojione-v1_flag-for-brazil.svg" 
                      : "/icons/emojione-v1_flag-for-united-states.svg"}
                    alt={locale === 'pt-BR' ? 'Brazil Flag' : 'US Flag'}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                  <span className="sr-only">
                    {locale === 'pt-BR' ? t.navigation?.switchToEnglish : t.navigation?.switchToPortuguese}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {locale === 'pt-BR' ? t.navigation?.switchToEnglish : t.navigation?.switchToPortuguese}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {themeState === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t.navigation?.toggleTheme}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t.navigation?.toggleTheme}
              </TooltipContent>
            </Tooltip>
          </div>

          <nav className="flex items-center space-x-3">
            {userStatus === 'authenticated' ? (
              <>
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "text-foreground/60 hover:text-foreground/80",
                    "dark:text-foreground/60 dark:hover:text-foreground/80",
                    pathname === "/profile" && "text-foreground dark:text-foreground font-medium"
                  )}
                >
                  <User className="h-4 w-4" />
                  {t.navigation?.myAccount}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-foreground/60 hover:text-foreground/80"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.navigation?.signOut}
                </Button>
              </>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "text-foreground/60 hover:text-foreground/80",
                  "dark:text-foreground/60 dark:hover:text-foreground/80",
                  pathname === "/auth" && "text-foreground dark:text-foreground font-medium"
                )}
              >
                {t.navigation?.signIn}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}