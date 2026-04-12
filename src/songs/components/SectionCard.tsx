import { GripVertical, Trash2 } from "lucide-react";
import { useI18n, getSectionLabel } from "@/i18n";
import type { SectionType } from "@/i18n/types";
import { SECTION_COLORS } from "@/songs/constants";

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
  dragHandleProps?: Record<string, unknown>;
}

export function SectionCard({
  section,
  onChange,
  onDelete,
  dragHandleProps,
}: SectionCardProps) {
  const { t, locale } = useI18n();
  const color = SECTION_COLORS[section.type];

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 pt-3">
        <div
          className="flex cursor-grab touch-none items-center text-text-secondary active:text-text-primary"
          {...dragHandleProps}
        >
          <GripVertical size={20} />
        </div>

        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />

        {section.type === "custom" ? (
          <input
            type="text"
            value={section.label ?? ""}
            onChange={(e) =>
              onChange({ ...section, label: e.target.value })
            }
            placeholder={t.song.customLabel}
            className="min-w-0 flex-1 border-b border-gray-200 bg-transparent px-1 py-1 text-sm font-semibold focus:border-gray-400 focus:outline-none"
          />
        ) : (
          <span className="text-sm font-semibold" style={{ color }}>
            {getSectionLabel(section.type, locale)}
          </span>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="ml-auto p-1.5 text-text-secondary transition-colors hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <p className="mb-1.5 text-xs text-text-secondary">{t.common.bars}</p>
        <div className="flex items-center gap-1.5">
          {BAR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ ...section, bars: preset })}
              className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm transition-colors"
              style={
                section.bars === preset
                  ? { backgroundColor: color, color: "#fff" }
                  : { backgroundColor: "#f3f4f6" }
              }
            >
              {preset}
            </button>
          ))}
          <input
            type="number"
            min={1}
            value={section.bars}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v > 0) onChange({ ...section, bars: v });
            }}
            className="h-9 w-14 rounded-lg border border-gray-200 bg-white px-2 text-center font-mono text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="px-3 pt-3">
        <p className="mb-1.5 text-xs text-text-secondary">{t.common.extraBeats}</p>
        <div className="flex items-center gap-1">
          {EXTRA_BEATS_OPTIONS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ ...section, extraBeats: val })}
              className="flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs transition-colors"
              style={
                section.extraBeats === val
                  ? { backgroundColor: color, color: "#fff" }
                  : { backgroundColor: "#f3f4f6" }
              }
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 px-3 pb-3 pt-3">
        <input
          type="text"
          value={section.chordProgression ?? ""}
          onChange={(e) =>
            onChange({ ...section, chordProgression: e.target.value || null })
          }
          placeholder={`${t.song.chordProgression}  (Am F C G)`}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
        <input
          type="text"
          value={section.memo ?? ""}
          onChange={(e) =>
            onChange({ ...section, memo: e.target.value || null })
          }
          placeholder={t.song.memo}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
