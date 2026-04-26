import { createFileRoute, Link, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useToast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useLoadMore } from "@/lib/use-load-more";
import { listSetlists, type SetlistWithSongCount } from "@/setlists/server-fns";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconCal, IconPin, IconPlus, IconSearch, Logomark } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import { StructureBar } from "@/ui/structure-bar";
import { TopBar } from "@/ui/top-bar";

export const Route = createFileRoute("/setlists/")({
  component: SetlistsPage,
});

function SetlistsPage() {
  const initial = useLoaderData({ from: "/setlists" });
  const search = useSearch({ from: "/setlists" });
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [input, setInput] = useState(search.q ?? "");
  const debouncedInput = useDebouncedValue(input, 300);

  // Sync local input with URL query synchronously during render when the PC
  // sidebar navigates — same boundKey pattern as Songs.
  const queryKey = search.q ?? "";
  const [boundKey, setBoundKey] = useState(queryKey);
  if (boundKey !== queryKey) {
    setBoundKey(queryKey);
    setInput(queryKey);
  }

  const {
    items: setlists,
    hasMore,
    loading: loadingMore,
    loadMore,
  } = useLoadMore({
    initialItems: initial.items,
    initialHasMore: initial.hasMore,
    resetKey: queryKey,
    fetchMore: (offset) => listSetlists({ data: { offset, query: search.q } }),
  });

  useEffect(() => {
    const next = debouncedInput.trim() || undefined;
    if (next === search.q) return;
    if (input !== debouncedInput) return;
    navigate({ to: "/setlists", search: next ? { q: next } : {}, replace: true });
  }, [debouncedInput, input, search.q, navigate]);

  function handleCreate() {
    navigate({ to: "/setlists/new" });
  }

  async function handleLoadMore() {
    try {
      await loadMore();
    } catch (error) {
      clientLogger.error("loadMoreSetlists", error);
      toast.error(t.common.errorLoadFailed);
    }
  }

  function handleClearSearch() {
    setInput("");
    navigate({ to: "/setlists", search: {}, replace: true });
  }

  const isSearching = !!search.q;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* PC (≥lg): the list lives in the layout sidebar. Render a hint pane here. */}
      <div className="hidden min-h-screen lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <MetaTag>
            {setlists.length === 0 ? (isSearching ? t.setlist.noMatches : t.setlist.noSetlists) : t.nav.setlists}
          </MetaTag>
          {setlists.length === 0 && isSearching && (
            <p style={{ color: "var(--color-dim)", fontSize: 14, maxWidth: 320 }}>{t.setlist.searchNoResults}</p>
          )}
          {!isSearching && (
            <div className="mt-2">
              <ConsoleBtn tone="accent" onClick={handleCreate}>
                <IconPlus size={10} />
                {t.setlist.newSetlist.toUpperCase()}
              </ConsoleBtn>
            </div>
          )}
        </div>
      </div>

      <div
        className="mx-auto flex min-h-screen max-w-2xl flex-col lg:hidden"
        style={{
          background: "var(--color-ink)",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <TopBar
          title={t.nav.setlists}
          subtitle={`${String(setlists.length).padStart(2, "0")} ${isSearching ? t.setlist.shown : t.setlist.total}`}
          left={<Logomark size={28} />}
          right={
            <ConsoleBtn tone="inverse" onClick={handleCreate}>
              <IconPlus size={10} />
              {t.common.new.toUpperCase()}
            </ConsoleBtn>
          }
        />

        <div
          className="flex items-center gap-3"
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <IconSearch size={14} style={{ color: "var(--color-dim)" }} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.setlist.searchPlaceholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: 14,
              fontFamily: "var(--font-sans)",
            }}
          />
          {input ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label={t.setlist.searchClear}
              style={{
                color: "var(--color-dim-2)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 2,
                fontSize: 16,
              }}
            >
              ×
            </button>
          ) : (
            <MetaTag>A–Z</MetaTag>
          )}
        </div>

        {setlists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
            <MetaTag>{isSearching ? t.setlist.noMatches : t.setlist.noSetlists}</MetaTag>
            {isSearching && <p style={{ color: "var(--color-dim)", fontSize: 14 }}>{t.setlist.searchNoResults}</p>}
            {!isSearching && (
              <div className="mt-2">
                <ConsoleBtn tone="accent" onClick={handleCreate}>
                  <IconPlus size={10} />
                  {t.setlist.newSetlist.toUpperCase()}
                </ConsoleBtn>
              </div>
            )}
          </div>
        ) : (
          <>
            <ul>
              {setlists.map((setlist, index) => (
                <SetlistRow key={setlist.id} setlist={setlist} index={index} />
              ))}
            </ul>
            {hasMore && (
              <div className="flex justify-center py-6">
                <ConsoleBtn onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? t.common.loading : t.common.loadMore}
                </ConsoleBtn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SetlistRow({ setlist, index }: { setlist: SetlistWithSongCount; index: number }) {
  const sections = useMemo(
    () => setlist.songStructure.map((type, i) => ({ id: `${setlist.id}-${i}`, type, bars: 1 })),
    [setlist],
  );

  return (
    <li style={{ borderBottom: "1px solid var(--color-line)" }}>
      <Link
        to="/setlists/$id"
        params={{ id: setlist.id }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "16px 18px",
          color: "var(--color-text)",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 500,
            color: "var(--color-dim-2)",
            letterSpacing: "0.18em",
            paddingTop: 4,
            width: 22,
            flexShrink: 0,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate" style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)" }}>
            {setlist.title}
          </p>
          {(setlist.sessionDate || setlist.venue) && (
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: "4px 14px",
                marginTop: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "var(--color-dim)",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {setlist.sessionDate && (
                <span className="flex items-center gap-1">
                  <IconCal size={11} />
                  {setlist.sessionDate}
                </span>
              )}
              {setlist.venue && (
                <span className="flex min-w-0 items-center gap-1">
                  <IconPin size={11} />
                  <span className="truncate">{setlist.venue}</span>
                </span>
              )}
            </div>
          )}
          {sections.length > 0 && <StructureBar sections={sections} height={4} gap={2} style={{ marginTop: 10 }} />}
          <MetaTag size={9} style={{ display: "block", marginTop: 6 }}>
            {String(setlist.songCount).padStart(2, "0")} SONGS
          </MetaTag>
        </div>
      </Link>
    </li>
  );
}
