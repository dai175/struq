import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n";
import { ConsoleBtn } from "@/ui/console-btn";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ConfirmTone = "coral" | "accent";

interface ConfirmModalProps {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Visual weight of the confirm button. Defaults to "coral" for destructive actions. */
  tone?: ConfirmTone;
  /** Overrides the default localized "Confirm" heading. */
  title?: string;
}

export function ConfirmModal({
  open,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = "coral",
  title,
}: ConfirmModalProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;
    const first = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)?.[0];
    first?.focus();
    return () => {
      (previousFocusRef.current as HTMLElement | null)?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  function handleDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (e.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismisses modal on click
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled via document keydown listener
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-[420px]"
        style={{
          background: "var(--color-ink-2)",
          border: "1px solid var(--color-line)",
          color: "var(--color-text)",
          borderRadius: 2,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div style={{ padding: "20px 22px 18px" }}>
          <div
            id={titleId}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--color-dim-2)",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            {title ?? t.common.confirm}
          </div>
          <p
            id={descId}
            style={{
              margin: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "var(--color-text)",
            }}
          >
            {message}
          </p>
        </div>
        <div
          className="flex justify-end gap-2"
          style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--color-line)",
            background: "var(--color-ink)",
          }}
        >
          <ConsoleBtn tone="neutral" onClick={onCancel}>
            {cancelLabel}
          </ConsoleBtn>
          <ConsoleBtn tone={tone} onClick={onConfirm}>
            {confirmLabel}
          </ConsoleBtn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
