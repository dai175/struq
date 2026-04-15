import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismisses modal on click
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled via document keydown listener
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-opacity active:opacity-70"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-opacity active:opacity-70"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
