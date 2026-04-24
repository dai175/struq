import { useState } from "react";

// Paginated list with a "load more" button: accumulates pages fetched after the
// initial loader-provided page. Resets when `resetKey` changes (typically the
// active search query) so a new query starts from a fresh page 1.
//
// The reset runs synchronously during render to match the TanStack Router
// pattern used alongside it — a useEffect-based reset would leave extras stale
// while a sibling input triggers a navigate, producing revert-navigate loops.
export function useLoadMore<T>({
  initialItems,
  initialHasMore,
  resetKey,
  fetchMore,
}: {
  initialItems: T[];
  initialHasMore: boolean;
  resetKey: string;
  fetchMore: (offset: number) => Promise<{ items: T[]; hasMore: boolean }>;
}): {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
} {
  const [extras, setExtras] = useState<T[]>([]);
  const [extrasHasMore, setExtrasHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boundKey, setBoundKey] = useState(resetKey);

  if (boundKey !== resetKey) {
    setBoundKey(resetKey);
    setExtras([]);
    setExtrasHasMore(false);
  }

  const items = extras.length > 0 ? [...initialItems, ...extras] : initialItems;
  const hasMore = extras.length > 0 ? extrasHasMore : initialHasMore;

  async function loadMore() {
    setLoading(true);
    try {
      const next = await fetchMore(items.length);
      setExtras((prev) => [...prev, ...next.items]);
      setExtrasHasMore(next.hasMore);
    } finally {
      setLoading(false);
    }
  }

  return { items, hasMore, loading, loadMore };
}
