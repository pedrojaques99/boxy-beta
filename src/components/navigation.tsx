'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { createClient } from '@/lib/supabase/client';
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

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [themeState, setThemeState] = useState<'light' | 'dark'>(theme);
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useTranslations();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setThemeState(theme);
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      console.error('Error changing language:', error);
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
            <motion.span 
              className={cn(
                "font-bold text-xl",
                "text-foreground/90 dark:text-foreground/90"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              BOXY
            </motion.span>
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
            {user ? (
              <>
                <Link href="/profile">
                  <Button 
                    variant="default" 
                    size="sm"
                    className={cn(
                      "text-sm font-medium bg-accent",
                      "text-accent-foreground hover:bg-accent/90",
                      "dark:bg-accent dark:text-accent-foreground dark:hover:bg-accent/90",
                      pathname === "/profile" && "bg-accent/90"
                    )}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t.navigation?.myAccount}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className={cn(
                    "text-sm font-normal border-muted-foreground/40",
                    "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    "dark:border-muted-foreground/40 dark:text-muted-foreground dark:hover:bg-muted/30 dark:hover:text-foreground"
                  )}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.navigation?.signOut}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "text-sm font-medium",
                      "text-muted-foreground hover:text-foreground",
                      "dark:text-muted-foreground dark:hover:text-foreground"
                    )}
                  >
                    {t.navigation?.signIn}
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button 
                    variant="default"
                    size="sm"
                    className={cn(
                      "text-sm font-medium",
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                      "dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    )}
                  >
                    {t.navigation?.getStarted}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}