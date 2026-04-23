import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { getSectionLabel, useI18n } from "@/i18n";
import { SECTION_COLORS } from "@/songs/constants";
import { IconDrag, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";
import type { SectionData } from "./SectionCard";

const BAR_PRESETS = [1, 2, 4, 8, 16];
const EXTRA_BEATS_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

interface PcSectionRowProps {
  section: SectionData;
  index: number;
  onChange: (updated: SectionData) => void;
  onDelete: () => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

/**
 * Compact single-line section row used in the PC editor's SECTIONS column.
 * Grid matches handoff spec: drag · # · label+TYPE · chord · NN BARS · Nb · trash.
 * Bars + extra beats edit via a popover anchored to the NN BARS cell; memo
 * lives in a secondary row ("+ NOTE" when empty, inline input when present).
 */
export function PcSectionRow({ section, index, onChange, onDelete, dragAttributes, dragListeners }: PcSectionRowProps) {
  const { t, locale } = useI18n();
  const color = SECTION_COLORS[section.type];
  const displayLabel = section.type === "custom" ? (section.label ?? "") : getSectionLabel(section.type, locale);
  const totalBeats = section.bars * 4 + section.extraBeats;
  const [editingMemo, setEditingMemo] = useState(false);
  const memoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMemo && !section.memo) memoInputRef.current?.focus();
  }, [editingMemo, section.memo]);

  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        borderLeft: `3px solid ${color}`,
        background: "rgba(255,255,255,0.02)",
        borderRadius: 1,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "18px 36px 1fr 140px 90px 90px 28px",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
        }}
      >
        <button
          type="button"
          {...dragAttributes}
          {...dragListeners}
          aria-label="Reorder"
          style={{
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-dim-2)",
            background: "transparent",
            border: "none",
            cursor: "grab",
            touchAction: "none",
            padding: 0,
          }}
        >
          <IconDrag size={14} />
        </button>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--color-dim)",
            fontWeight: 500,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="flex items-baseline min-w-0" style={{ gap: 12 }}>
          {section.type === "custom" ? (
            <input
              type="text"
              value={section.label ?? ""}
              onChange={(e) => onChange({ ...section, label: e.target.value })}
              placeholder={t.song.customLabel}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                padding: 0,
              }}
            />
          ) : (
            <span className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
              {displayLabel}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              color,
              textTransform: "uppercase",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {section.type.toUpperCase()}
          </span>
        </div>

        <input
          type="text"
          value={section.chordProgression ?? ""}
          onChange={(e) => onChange({ ...section, chordProgression: e.target.value || null })}
          placeholder={t.song.chordProgression}
          aria-label={t.song.chordProgression}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.15em",
            color: "var(--color-dim)",
            fontWeight: 500,
            padding: 0,
          }}
        />

        <BarsPopover section={section} color={color} onChange={onChange} />

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--color-dim-2)",
            letterSpacing: "0.08em",
            textAlign: "right",
          }}
        >
          {totalBeats}b
        </div>

        <button
          type="button"
          onClick={onDelete}
          aria-label={t.common.delete}
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-dim-3)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <IconTrash size={14} />
        </button>
      </div>

      <div
        style={{
          padding: "0 14px 10px 58px",
        }}
      >
        {editingMemo || section.memo ? (
          <input
            ref={memoInputRef}
            type="text"
            value={section.memo ?? ""}
            onChange={(e) => onChange({ ...section, memo: e.target.value || null })}
            onBlur={() => setEditingMemo(false)}
            placeholder={t.song.memo}
            aria-label={t.song.memo}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 12,
              color: "var(--color-text)",
              padding: 0,
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingMemo(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-dim-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
            }}
          >
            + {t.song.memo}
          </button>
        )}
      </div>
    </div>
  );
}

function BarsPopover({
  section,
  color,
  onChange,
}: {
  section: SectionData;
  color: string;
  onChange: (updated: SectionData) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", textAlign: "right" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.common.bars}
        style={{
          background: "transparent",
          border: "none",
          padding: "2px 4px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color,
          letterSpacing: "0.08em",
          fontWeight: 600,
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        {String(section.bars).padStart(2, "0")} {t.common.bars}
      </button>

      {open && (
        <div
          role="dialog"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: 260,
            background: "var(--color-ink-2)",
            border: "1px solid var(--color-line-2)",
            borderRadius: 2,
            padding: "14px 14px 12px",
            boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
            textAlign: "left",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <MetaTag size={9}>{t.common.bars.toUpperCase()}</MetaTag>
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
            {BAR_PRESETS.map((preset) => {
              const active = section.bars === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ ...section, bars: preset })}
                  style={{
                    width: 36,
                    height: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    border: active ? `1px solid ${color}` : "1px solid var(--color-line)",
                    background: active ? `color-mix(in srgb, ${color} 18%, transparent)` : "transparent",
                    color: active ? color : "var(--color-text)",
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                >
                  {preset}
                </button>
              );
            })}
            <input
              type="number"
              min={1}
              value={section.bars}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (v > 0) onChange({ ...section, bars: v });
              }}
              style={{
                width: 56,
                height: 30,
                border: "1px solid var(--color-line)",
                background: "transparent",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                textAlign: "center",
                outline: "none",
                borderRadius: 2,
              }}
            />
          </div>

          <div style={{ marginTop: 14, marginBottom: 8 }}>
            <MetaTag size={9}>{t.common.extraBeats.toUpperCase()}</MetaTag>
          </div>
          <div className="flex items-center" style={{ gap: 4, flexWrap: "wrap" }}>
            {EXTRA_BEATS_OPTIONS.map((val) => {
              const active = section.extraBeats === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ ...section, extraBeats: val })}
                  style={{
                    width: 30,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    border: active ? `1px solid ${color}` : "1px solid var(--color-line)",
                    background: active ? `color-mix(in srgb, ${color} 18%, transparent)` : "transparent",
                    color: active ? color : "var(--color-text)",
                    cursor: "pointer",
                    borderRadius: 2,
                  }}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
