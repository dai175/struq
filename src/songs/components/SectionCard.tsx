import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { getSectionLabel, useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";
import { IconDrag, IconTrash } from "@/ui/icons";
import { BarsPopover } from "./BarsPopover";

export interface SectionData {
  id: string;
  type: SectionType;
  label: string | null;
  bars: number;
  extraBeats: number;
  chordProgression: string | null;
  memo: string | null;
}

interface SectionCardProps {
  section: SectionData;
  index: number;
  onChange: (updated: SectionData) => void;
  onDelete: () => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

export function SectionCard({ section, index, onChange, onDelete, dragAttributes, dragListeners }: SectionCardProps) {
  const { t, locale } = useI18n();
  const color = SECTION_COLORS[section.type];
  const displayLabel = section.type === "custom" ? (section.label ?? "") : getSectionLabel(section.type, locale);
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
          gridTemplateColumns: "18px 28px 1fr auto 28px",
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

        <div className="flex items-baseline min-w-0" style={{ gap: 10 }}>
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

        <BarsPopover section={section} color={color} onChange={onChange} />

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

      <div style={{ padding: "0 14px 8px 56px" }}>
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
      </div>

      <div style={{ padding: "0 14px 10px 56px" }}>
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
