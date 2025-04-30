import { useEffect, useState, useCallback, useRef } from 'react';

interface UseInfiniteScrollProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
}: UseInfiniteScrollProps) {
  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLAnchorElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading && !isFetching) {
        setIsFetching(true);
        onLoadMore().finally(() => setIsFetching(false));
      }
    },
    [hasMore, isLoading, isFetching, onLoadMore]
  );

  useEffect(() => {
    const element = lastElementRef.current;
    if (!element) return;

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    });

    observer.current.observe(element);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  return { lastElementRef, isFetching };
} 