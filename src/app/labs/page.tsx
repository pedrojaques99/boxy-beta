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

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { t } = useTranslations();
  
  const authService = getAuthService();

  const fetchLabs = useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoading(true);
    try {
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
  }, []);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  ), []);

  if (!t) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-4">{t.labs.title}</h1>
        <p className="text-stone-600 dark:text-stone-300">
          {t.labs.description}
        </p>
      </div>

      {/* Labs Grid */}
      <div className="space-y-6">
        {loading && page === 1 ? (
          LoadingSkeleton
        ) : labs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-stone-500">{t.labs.noLabs}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab, index) => (
                <Link
                  key={lab.id}
                  href={lab.app_url}
                  ref={index === labs.length - 1 ? lastElementRef : undefined}
                  className="block transition-transform hover:scale-[1.02] hover:shadow-lg rounded-lg"
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
                  />
                </Link>
              ))}
            </div>
            {isFetching && LoadingSkeleton}
          </>
        )}
      </div>
    </div>
  );
} 