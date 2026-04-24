import { useRef, useState } from "react";

// Paginated list with a "load more" button: accumulates pages fetched after the
// initial loader-provided page. Resets when `resetKey` changes (typically the
// active search query) so a new query starts from a fresh page 1.
//
// The reset runs synchronously during render to match the TanStack Router
// pattern used alongside it — a useEffect-based reset would leave extras stale
// while a sibling input triggers a navigate, producing revert-navigate loops.
//
// A monotonic `runToken` guards against late fetchMore responses: when
// `resetKey` changes or the caller calls `reset()` mid-flight, the token bumps
// and any in-flight response is discarded instead of corrupting `extras`.
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
  reset: () => void;
} {
  const [extras, setExtras] = useState<T[]>([]);
  const [extrasHasMore, setExtrasHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boundKey, setBoundKey] = useState(resetKey);
  const runTokenRef = useRef(0);

  if (boundKey !== resetKey) {
    setBoundKey(resetKey);
    setExtras([]);
    setExtrasHasMore(false);
    setLoading(false);
    runTokenRef.current++;
  }

  const items = extras.length > 0 ? [...initialItems, ...extras] : initialItems;
  const hasMore = extras.length > 0 ? extrasHasMore : initialHasMore;

  async function loadMore() {
    runTokenRef.current++;
    const token = runTokenRef.current;
    setLoading(true);
    try {
      const next = await fetchMore(items.length);
      if (runTokenRef.current !== token) return;
      setExtras((prev) => [...prev, ...next.items]);
      setExtrasHasMore(next.hasMore);
    } finally {
      if (runTokenRef.current === token) setLoading(false);
    }
  }

  function reset() {
    setExtras([]);
    setExtrasHasMore(false);
    setLoading(false);
    runTokenRef.current++;
  }

  return { items, hasMore, loading, loadMore, reset };
}
