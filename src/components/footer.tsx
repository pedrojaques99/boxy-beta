import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Boxy</h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm">
              Your minimalist solution for modern living.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-stone-600 dark:text-stone-300 hover:text-[#bfff58] dark:hover:text-[#bfff58] text-sm transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-stone-600 dark:text-stone-300 hover:text-[#bfff58] dark:hover:text-[#bfff58] text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-stone-600 dark:text-stone-300 hover:text-[#bfff58] dark:hover:text-[#bfff58] text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-stone-600 dark:text-stone-300 hover:text-[#bfff58] dark:hover:text-[#bfff58] text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-stone-600 dark:text-stone-300 hover:text-[#bfff58] dark:hover:text-[#bfff58] text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800">
          <p className="text-center text-stone-600 dark:text-stone-300 text-sm">
            © {new Date().getFullYear()} Boxy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 