'use client';

import { getAuthService } from '@/lib/auth/auth-service';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import AppCard from '@/components/AppCard';
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from '@/hooks/use-translations';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { handleError } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { HeroSection } from '@/components/ui/hero-section';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Lab {
  id: string;
  name: string;
  description: string;
  thumb_url: string;
  is_free: boolean;
  tags: string[];
  created_by: string;
  app_url: string;
  software: string;
  type: string;
}

const ITEMS_PER_PAGE = 12;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { t } = useTranslations();
  
  const authService = getAuthService();
  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        // Handle unauthenticated state if needed
        console.log('User is not authenticated');
      }
    };
    checkAuth();
  }, [authService]);

  const fetchLabs = useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoading(true);
    try {
      // Use direct Supabase client for labs fetching
      let query = supabase
        .from('labs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply pagination
      const from = (pageNum - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching labs:', error);
        const { error: errorMessage } = handleError(error, 'Error fetching labs');
        toast.error(errorMessage);
        return;
      }

      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      
      if (reset) {
        setLabs(data || []);
      } else {
        setLabs(prev => [...prev, ...(data || [])]);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
      const { error: errorMessage } = handleError(error, 'Error fetching labs');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
    await fetchLabs(page + 1);
  }, [hasMore, loading, page, fetchLabs]);

  const { lastElementRef, isFetching } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: loading,
  });

  // Initial fetch
  useEffect(() => {
    fetchLabs(1, true);
  }, [fetchLabs]);

  const LoadingSkeleton = useMemo(() => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </motion.div>
  ), []);

  if (!t) return null;

  return (
    <>
      <HeroSection
        title={t.labs.title}
        description={t.labs.description}
        pattern="grid"
      >
        <Button variant="outline" size="lg" className="group">
          <Beaker className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
          Start Exploring
        </Button>
      </HeroSection>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {loading && page === 1 ? (
            LoadingSkeleton
          ) : labs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full text-center py-12"
            >
              <p className="text-stone-500">{t.labs.noLabs}</p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {labs.map((lab, index) => (
                <Link
                  key={lab.id}
                  href={lab.app_url}
                  ref={index === labs.length - 1 ? lastElementRef : undefined}
                  className="block"
                >
                  <AppCard
                    id={lab.id}
                    name={lab.name}
                    description={lab.description}
                    thumbUrl={lab.thumb_url}
                    isFree={lab.is_free}
                    tags={lab.tags}
                    createdBy={lab.created_by}
                    appUrl={lab.app_url}
                    delay={index * 0.1}
                  />
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading More Indicator */}
        <div className="w-full py-8 flex justify-center">
          <AnimatePresence>
            {loading && labs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading more labs...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
} 