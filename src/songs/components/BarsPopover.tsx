import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { MetaTag } from "@/ui/meta-tag";
import type { SectionData } from "./SectionRow";

const BAR_PRESETS = [1, 2, 4, 8, 16];
const EXTRA_BEATS_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

interface BarsPopoverProps {
  section: SectionData;
  color: string;
  onChange: (updated: SectionData) => void;
}

export function BarsPopover({ section, color, onChange }: BarsPopoverProps) {
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
