import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from './ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  thumbUrl: string;
  type: string;
  tags: string[];
  createdBy: string;
  appUrl: string;
}

export default function AppCard({
  id,
  name,
  description,
  thumbUrl,
  type,
  tags,
  createdBy,
  appUrl
}: AppCardProps) {
  const { canAccessProduct, isPremium } = useSubscription();
  const hasAccess = canAccessProduct(type);

  return (
    <Card className="overflow-hidden group">
      <div className="relative h-48 w-full">
        <Image
          src={thumbUrl || '/placeholder.png'}
          alt={name}
          fill
          className={`object-cover ${!hasAccess ? 'filter blur-sm' : ''}`}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {type === 'free' ? (
            <div className="bg-green-500 text-white px-2 py-1 rounded-md text-sm">
              Free
            </div>
          ) : (
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm">
              Premium
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <Link href={hasAccess ? appUrl : '/price'} className="block">
          <h3 className="text-xl font-semibold text-stone-800 hover:text-blue-600 transition-colors dark:text-white flex items-center gap-2">
            {name}
            {!hasAccess && <Lock className="h-4 w-4" />}
          </h3>
        </Link>
        
        <p className="text-stone-600 mt-2 line-clamp-2 dark:text-stone-300">
          {description}
        </p>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="bg-stone-100 text-stone-600 px-2 py-1 rounded-md text-sm dark:bg-stone-800 dark:text-stone-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <span className="text-sm text-stone-500 dark:text-stone-400">
          By {createdBy}
        </span>
        {hasAccess ? (
          <Link
            href={appUrl}
            target="_blank"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300"
          >
            Try it →
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/price'}
            className="text-sm"
          >
            Upgrade to Premium
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 