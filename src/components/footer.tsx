'use client'

import Link from 'next/link'
import { useTranslations } from '@/hooks/use-translations'

export function Footer() {
  const { t } = useTranslations()

  if (!t) return null

  return (
    <footer className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{t.footer.brand.title}</h3>
            <p className="text-sm text-muted-foreground">
              {t.footer.brand.description}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t.footer.products.title}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.products.explore}
                </Link>
              </li>
              <li>
                <Link href="/price" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.products.pricing}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t.footer.resources.title}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.resources.blog}
                </Link>
              </li>
              <li>
                <Link href="/discord" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t.footer.resources.community}
                </Link>
              </li>
            </ul>
          </div>
          <div>
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
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>{t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </footer>
  )
} 
