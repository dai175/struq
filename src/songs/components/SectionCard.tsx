import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { getSectionLabel, useI18n } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";
import { IconDrag, IconTrash } from "@/ui/icons";
import { MetaTag } from "@/ui/meta-tag";

const BAR_PRESETS = [1, 2, 4, 8, 16];
const EXTRA_BEATS_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

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
  onChange: (updated: SectionData) => void;
  onDelete: () => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
}

export function SectionCard({ section, onChange, onDelete, dragAttributes, dragListeners }: SectionCardProps) {
  const { t, locale } = useI18n();
  const color = SECTION_COLORS[section.type];
  const displayLabel = section.type === "custom" ? (section.label ?? "") : getSectionLabel(section.type, locale);

  return (
    <div
      style={{
        border: "1px solid var(--color-line)",
        borderLeft: `3px solid ${color}`,
        background: "var(--color-ink-2)",
      }}
    >
      <div className="flex items-center gap-2" style={{ padding: "12px 14px 10px" }}>
        <button
          type="button"
          aria-label="Reorder"
          {...dragAttributes}
          {...dragListeners}
          style={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-dim-2)",
            background: "transparent",
            border: "none",
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <IconDrag size={14} />
        </button>

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
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          />
        ) : (
          <span className="flex-1 min-w-0 truncate" style={{ fontSize: 14, fontWeight: 600, color }}>
            {displayLabel}
          </span>
        )}

        <MetaTag size={9}>{section.type.toUpperCase()}</MetaTag>

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
            color: "var(--color-dim-2)",
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
          display: "grid",
          gap: 10,
          padding: "6px 14px 14px",
        }}
      >
        <div>
          <div style={{ marginBottom: 6 }}>
            <MetaTag size={9}>{t.common.bars.toUpperCase()}</MetaTag>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {BAR_PRESETS.map((preset) => {
              const active = section.bars === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ ...section, bars: preset })}
                  style={{
                    width: 36,
                    height: 32,
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
                height: 32,
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
        </div>

        <div>
          <div style={{ marginBottom: 6 }}>
            <MetaTag size={9}>{t.common.extraBeats.toUpperCase()}</MetaTag>
          </div>
          <div className="flex items-center gap-1">
            {EXTRA_BEATS_OPTIONS.map((val) => {
              const active = section.extraBeats === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ ...section, extraBeats: val })}
                  style={{
                    width: 30,
                    height: 28,
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

        <input
          type="text"
          value={section.chordProgression ?? ""}
          onChange={(e) => onChange({ ...section, chordProgression: e.target.value || null })}
          placeholder={`${t.song.chordProgression}  (Am F C G)`}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--color-line)",
            padding: "10px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "#fff",
            outline: "none",
            borderRadius: 0,
            letterSpacing: "0.08em",
          }}
        />
        <input
          type="text"
          value={section.memo ?? ""}
          onChange={(e) => onChange({ ...section, memo: e.target.value || null })}
          placeholder={t.song.memo}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--color-line)",
            padding: "10px 12px",
            fontSize: 14,
            color: "#fff",
            outline: "none",
            borderRadius: 0,
          }}
        />
      </div>
    </div>
  );
}
