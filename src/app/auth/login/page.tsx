'use client'

import { LoginForm } from '@/components/login-form'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  
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
        <LoginForm />
      </motion.div>
    </div>
  )
}
