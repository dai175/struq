import { Hand, Play } from "lucide-react";
import { useI18n } from "@/i18n";

interface ModeSelectOverlayProps {
  /** BPM of the song. When null/undefined/<=0, the auto button is disabled. */
  bpm: number | null | undefined;
  onSelectManual: () => void;
  onSelectAuto: () => void;
}

export function ModeSelectOverlay({ bpm, onSelectManual, onSelectAuto }: ModeSelectOverlayProps) {
  const { t } = useI18n();
  const autoEnabled = typeof bpm === "number" && bpm > 0;

  return (
    <div className="flex flex-1 items-center justify-center px-6 lg:px-12">
      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onSelectManual}
          className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 py-12 transition-opacity active:opacity-70"
        >
          <Hand size={40} className="opacity-70" />
          <span className="text-xl font-semibold">{t.perform.modeSelect.manual}</span>
        </button>

        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={onSelectAuto}
            disabled={!autoEnabled}
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/5 py-12 transition-opacity active:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Play size={40} className="opacity-70" />
            <span className="text-xl font-semibold">{t.perform.modeSelect.auto}</span>
          </button>
          {!autoEnabled && <p className="text-center text-xs opacity-50">{t.perform.modeSelect.bpmRequired}</p>}
        </div>
      </div>
    </div>
  );
}
