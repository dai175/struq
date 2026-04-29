import { useEffect } from "react";
import { useI18n } from "@/i18n";
import type { PickerSong } from "@/setlists/editor/use-song-picker";
import { ConsoleBtn } from "@/ui/console-btn";
import { IconPlus, IconSearch } from "@/ui/icons";

export function SongPickerModal({
  open,
  input,
  onInputChange,
  availableSongs,
  loading,
  setlistHasSongs,
  onAdd,
  onClose,
}: {
  open: boolean;
  input: string;
  onInputChange: (value: string) => void;
  availableSongs: PickerSong[];
  loading: boolean;
  setlistHasSongs: boolean;
  onAdd: (song: PickerSong) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const emptyMessage = input.trim()
    ? t.song.searchNoResults
    : setlistHasSongs
      ? t.setlist.pickerAllAdded
      : t.song.noSongs;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label={t.common.cancel}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.setlist.addSong}
        className="relative z-10 w-full max-w-md"
        style={{
          background: "var(--color-ink-2)",
          border: "1px solid var(--color-line)",
          color: "var(--color-text)",
          paddingBottom: 20,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{t.setlist.addSong}</div>
          </div>
          <ConsoleBtn onClick={onClose}>{t.common.close.toUpperCase()}</ConsoleBtn>
        </div>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--color-line)",
              padding: "10px 12px",
            }}
          >
            <IconSearch size={14} />
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={t.song.searchPlaceholder}
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
            {input && (
              <button
                type="button"
                onClick={() => onInputChange("")}
                aria-label={t.song.searchClear}
                style={{
                  color: "var(--color-dim-2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto" style={{ padding: "12px 18px" }}>
          {loading ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {t.common.loading}
            </p>
          ) : availableSongs.length === 0 ? (
            <p className="py-8 text-center" style={{ color: "var(--color-dim)", fontSize: 14 }}>
              {emptyMessage}
            </p>
          ) : (
            <ul style={{ borderTop: "1px solid var(--color-line)" }}>
              {availableSongs.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(song)}
                    className="flex w-full items-center gap-3 text-left"
                    style={{
                      padding: "14px 4px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--color-line)",
                      color: "var(--color-text)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                        {song.title}
                      </div>
                      {song.artist && (
                        <div
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: "0.18em",
                            color: "var(--color-dim-2)",
                            textTransform: "uppercase",
                            marginTop: 3,
                          }}
                        >
                          {song.artist}
                        </div>
                      )}
                    </div>
                    <IconPlus size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
