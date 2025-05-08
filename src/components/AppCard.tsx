import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from './ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { Lock } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  thumbUrl?: string;
  isFree: boolean;
  tags?: string[];
  createdBy: string;
  appUrl: string;
  delay?: number;
}

export default function AppCard({
  id,
  name,
  description,
  thumbUrl = '/placeholder.png',
  isFree,
  tags = [],
  createdBy,
  appUrl,
  delay = 0
}: AppCardProps) {
  const { subscriptionType } = useSubscription();
  const { t } = useTranslations();
  const hasAccess = isFree || subscriptionType === 'premium';
  const targetUrl = hasAccess ? appUrl : '/price';

  if (!t) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className={cn(
        "overflow-hidden group h-full",
        "transition-all duration-200",
        "hover:shadow-lg hover:border-accent/50",
        "flex flex-col"
      )}>
        <div className="relative h-48 w-full shrink-0 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full"
          >
            <Image
              src={thumbUrl || '/placeholder.png'}
              alt={name}
              fill
              className={cn(
                "object-cover transition-all duration-300",
                !hasAccess && "filter blur-sm group-hover:blur-none"
              )}
            />
          </motion.div>
          <div className="absolute top-2 right-2 flex gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.1 }}
              className={cn(
                "bg-accent/70 border border-accent/50 text-accent-foreground px-2 py-1 rounded-md text-sm",
                "backdrop-blur-sm"
              )}
            >
              {isFree ? "Free" : "Premium"}
            </motion.div>
          </div>
        </div>
        
        <CardContent className="flex-grow p-4">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.2 }}
            className={cn(
              "text-xl font-semibold text-stone-800 dark:text-white",
              "flex items-center gap-2 group-hover:text-accent transition-colors"
            )}
          >
            {name}
            {!hasAccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Lock className="h-4 w-4" />
              </motion.div>
            )}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.3 }}
            className="text-foreground/90 mt-2 dark:text-foreground/60 text-sm"
          >
            {description}
          </motion.p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.4 + (index * 0.1) }}
                className="bg-foreground/5 text-foreground/30 border border-foreground/5 px-2 py-1 rounded-full text-sm"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0 mt-auto border-t border-border/5">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.5 }}
            className="text-sm text-foreground/60"
          >
            By {createdBy}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + 0.5 }}
            className={cn(
              "text-sm font-medium",
              "text-accent group-hover:translate-x-1 transition-transform"
            )}
          >
            {t.labs.tryIt}
          </motion.span>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 