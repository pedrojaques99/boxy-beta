import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from './ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  thumbUrl: string;
  isFree: boolean;
  tags: string[];
  createdBy: string;
  appUrl: string;
}

export default function AppCard({
  id,
  name,
  description,
  thumbUrl,
  isFree,
  tags,
  createdBy,
  appUrl
}: AppCardProps) {
  const { canAccessProduct, isPremium } = useSubscription();
  const { t } = useTranslations();
  const hasAccess = isFree || isPremium;
  const targetUrl = hasAccess ? appUrl : '/price';

  if (!t) return null;

  return (
    <Card className={cn(
      "overflow-hidden group h-full",
      "transition-all duration-200",
      "hover:shadow-lg hover:border-accent/50",
      "flex flex-col"
    )}>
      <div className="relative h-48 w-full shrink-0">
        <Image
          src={thumbUrl || '/placeholder.png'}
          alt={name}
          fill
          className={cn(
            "object-cover transition-all duration-200",
            !hasAccess && "filter blur-sm group-hover:blur-none"
          )}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {isFree ? (
            <div className="bg-accent/70 border border-accent/50 text-accent-foreground px-2 py-1 rounded-md text-sm">
              Free
            </div>
          ) : (
            <div className="bg-accent/70 border border-accent/50 text-accent-foreground px-2 py-1 rounded-md text-sm">
              Premium
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className={cn(
          "text-xl font-semibold text-stone-800 dark:text-white",
          "flex items-center gap-2 group-hover:text-accent transition-colors"
        )}>
          {name}
          {!hasAccess && <Lock className="h-4 w-4" />}
        </h3>
        
        <p className="text-foreground/90 mt-2 dark:text-foreground/60 text-sm">
          {description}
        </p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="bg-foreground/5 text-foreground/30 border border-foreground/5 px-2 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0 mt-auto border-t border-border/5">
        <span className="text-sm text-foreground/60">
          By {createdBy}
        </span>
        <span className={cn(
          "text-sm font-medium",
          "text-accent group-hover:translate-x-1 transition-transform"
        )}>
          {t.labs.tryIt}
        </span>
      </CardFooter>
    </Card>
  );
} 