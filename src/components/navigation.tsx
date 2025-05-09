'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { LogOut, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from '@/hooks/use-translations';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { handleError } from '@/lib/error-handler';
import { getAuthService } from '@/lib/auth/auth-service';

type UserStatus = 'loading' | 'authenticated' | 'unauthenticated';

type Dictionary = {
  navigation?: {
    home: string
    about: string
    shop: string
    labs: string
    mindy: string
    pricing: string
    switchToEnglish: string
    switchToPortuguese: string
    toggleTheme: string
    myAccount: string
    signOut: string
    signIn: string
    getStarted: string
  }
}

export function Navigation() {
  const { theme, setTheme } = useTheme();
  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [userName, setUserName] = useState<string | null>(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [themeState, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
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

  const NavLinks = () => (
    <>
      <Link
        href="/"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        Home
      </Link>
      <Link
        href="/about"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/about') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t?.navigation?.about}
      </Link>
      <Link
        href="/shop"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/shop') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t?.navigation?.shop}
      </Link>
      <Link
        href="/labs"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/labs') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t?.navigation?.labs}
      </Link>
      <Link
        href="/mindy"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/mindy') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t?.navigation?.mindy}
      </Link>
      <Link
        href="/price"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/price') ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t?.navigation?.pricing}
      </Link>
    </>
  );

  if (!t) return null;

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm",
      "dark:border-border/40 dark:bg-background/80"
    )}>
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              className="h-7 w-auto"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Desktop Logo */}
              <Image 
                src="/logo/boxy-logotype-green.svg"
                alt="BOXY Logo"
                width={100}
                height={22}
                priority
                className="hidden md:block"
              />
              {/* Mobile Icon */}
              <Image 
                src="/logo/logo-boxy-icon.png"
                alt="BOXY Icon"
                width={28}
                height={28}
                priority
                className="block md:hidden"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <NavLinks />
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Right Side Controls */}
          <div className="hidden md:flex items-center justify-end space-x-2">
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
                      {locale === 'pt-BR' ? t?.navigation?.switchToEnglish : t?.navigation?.switchToPortuguese}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {locale === 'pt-BR' ? t?.navigation?.switchToEnglish : t?.navigation?.switchToPortuguese}
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
                    <span className="sr-only">{t?.navigation?.toggleTheme}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t?.navigation?.toggleTheme}
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
                      "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                      pathname === "/profile" && "bg-primary/90"
                    )}
                  >
                    <User className="h-4 w-4" />
                    {t?.navigation?.myAccount}
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-foreground/60 hover:text-foreground/80"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t?.navigation?.signOut}
                  </Button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                    pathname === "/auth" && "bg-primary/90"
                  )}
                >
                  {t?.navigation?.signIn}
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background"
          >
            <div className="container py-4 flex flex-col space-y-4">
              <nav className="flex flex-col space-y-4">
                <NavLinks />
              </nav>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLanguage}
                    disabled={isLanguageChanging}
                    className={cn(
                      "h-8 w-8",
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
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleThemeToggle}
                    className="h-8 w-8"
                  >
                    {themeState === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {userStatus === 'authenticated' ? (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t?.navigation?.myAccount}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t?.navigation?.signOut}
                    </Button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2"
                  >
                    {t?.navigation?.signIn}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}