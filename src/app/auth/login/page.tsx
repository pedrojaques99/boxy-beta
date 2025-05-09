'use client'

import { LoginForm } from '@/components/login-form'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

function LoginContent() {
  const searchParams = useSearchParams()
  
  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 md:p-10 overflow-hidden isolate">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/boxy-surreal-black-box8.webp"
          alt="Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 opacity-50">
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
        className="w-full max-w-sm relative z-10 margin-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LoginForm />
      </motion.div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm text-center">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
