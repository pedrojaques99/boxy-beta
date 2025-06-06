import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"
import { Layout } from "@/components/layout"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"
import { Toaster } from 'react-hot-toast'

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" }
  ]
}

export const metadata: Metadata = {
  title: "Boxy",
  description: "The only need-to-have toolbox for creators and designers",
  other: {
    "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "pragma": "public",
    "expires": "3600"
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Script for version detection */}
        <script src="/clear-cache/force-refresh.js" />
      </head>
      <body
        className={cn(
          GeistSans.className,
          "min-h-screen antialiased",
          "selection:bg-accent selection:text-accent-foreground",
          "scrollbar-thin scrollbar-thumb-accent scrollbar-track-background",
          "theme-transition"
        )}
        style={{
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))"
        }}
      >
        <Providers>
          <Layout>
            <div className="relative flex min-h-screen flex-col">
              {children}
            </div>
          </Layout>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
