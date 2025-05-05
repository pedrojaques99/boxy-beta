'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/use-translations'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function Page() {
  const { t } = useTranslations()

  return (
    <div className="relative flex min-h-[100vh] w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 opacity-50">
        {/* Gradient Orb 1 */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-accent/20 blur-[100px]"
          initial={{ x: -100, y: -100 }}
          animate={{ 
            x: [-100, 100, -100],
            y: [-100, 100, -100]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
            speed: 3
          }}
        />
        
        {/* Gradient Orb 2 */}
        <motion.div
          className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]"
          initial={{ x: 100, y: 100 }}
          animate={{ 
            x: [100, -100, 100],
            y: [100, -100, 100]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear",
            speed: 3
          }}
        />
      </div>

      {/* Content */}
      <motion.div 
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo/boxy-logo.webp"
                alt="BOXY Logo"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t?.auth?.signUpSuccess?.title || "Welcome to BOXY!"}
            </CardTitle>
            <CardDescription className="text-base">
              {t?.auth?.signUpSuccess?.description || "Your account has been successfully created."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center text-primary">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t?.auth?.signUpSuccess?.checkEmail || "Please check your email to verify your account."}
            </p>
            <div className="flex justify-center">
              <Link href="/shop">
                <Button className="w-full">
                  {t?.auth?.signUpSuccess?.continue || "Continue to Dashboard"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
