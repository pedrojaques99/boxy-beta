import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/boxy-surreal-black-box8.webp"
          alt="404 Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 py-16 max-w-2xl mx-auto">
        <h1 className="text-7xl font-bold mb-4 text-white animate-in slide-in-from-top duration-700">
          404
        </h1>
        <p className="text-3xl font-semibold mb-2 text-white/90 animate-in slide-in-from-left duration-700 delay-200">
          Page Not Found
        </p>
        <p className="text-xl mb-8 text-white/70 animate-in slide-in-from-right duration-700 delay-300">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-8 py-4 bg-white text-black rounded-full font-medium 
                     hover:bg-white/90 transition-all duration-300 animate-in fade-in duration-700 delay-500
                     hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          <span>Back to Home</span>
          <svg 
            className="ml-2 w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
} 