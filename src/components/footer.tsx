'use client'

import Link from 'next/link'
import { useTranslations } from '@/hooks/use-translations'
import Image from 'next/image'

export function Footer() {
  const { t } = useTranslations()

  if (!t) return null

  return (
    <footer className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand and Newsletter Column */}
          <div className="md:col-span-5 mr-20">
            <div className="mb-4">
              <Image 
                src="/logo/logo-boxy-icon.png"
                alt="BOXY Logo"
                width={32}
                height={32}
                priority
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t.footer.brand.description}
            </p>
            <div className="mt-8">
              <p className="text-sm text-muted-foreground mb-4">
                {t.footer.newsletter.description}
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder={t.footer.newsletter.placeholder}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-background bg-accent rounded-md hover:bg-accent/90 transition-colors"
                >
                  {t.footer.newsletter.subscribe}
                </button>
              </form>
            </div>
          </div>

          {/* Products Column */}
          <div className="md:col-span-3">
            <h4 className="font-semibold mb-4">{t.footer.products.title}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t?.navigation?.about}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t?.navigation?.shop}
                </Link>
              </li>
              <li>
                <Link href="/labs" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t?.navigation?.labs}
                </Link>
              </li>
              <li>
                <Link href="/mindy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t?.navigation?.mindy}
                </Link>
              </li>
              <li>
                <Link href="/price" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t?.navigation?.pricing}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-4">{t.footer.legal.title}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.legal.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.legal.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          {t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}
        </div>
      </div>
    </footer>
  )
} 
