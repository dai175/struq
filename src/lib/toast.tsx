import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ToastVariant = "error" | "success";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  timerId: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  toast: {
    error: (message: string) => void;
    success: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 3500;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => {
      const item = prev.find((t) => t.id === id);
      if (item) clearTimeout(item.timerId);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const show = useCallback((message: string, variant: ToastVariant) => {
    const id = crypto.randomUUID();
    const timerId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
    setToasts((prev) => {
      const next = [...prev, { id, message, variant, timerId }];
      const evicted = next.slice(0, next.length - MAX_TOASTS);
      for (const t of evicted) clearTimeout(t.timerId);
      return next.slice(-MAX_TOASTS);
    });
  }, []);

  const toast = useMemo(
    () => ({
      error: (message: string) => show(message, "error"),
      success: (message: string) => show(message, "success"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">
            {toasts.map((t) => (
              <ToastItem key={t.id} item={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), TOAST_DURATION - 200);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, []);

  const variantClass =
    item.variant === "error"
      ? "bg-red-50 border border-red-200 text-red-800"
      : "bg-emerald-50 border border-emerald-200 text-emerald-800";

  return (
    <div
      className={`${variantClass} rounded-xl px-4 py-3 shadow-lg transition-all duration-150 ease-out w-[min(calc(100vw-2rem),24rem)] ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{item.message}</span>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="shrink-0 text-current opacity-50 transition-opacity hover:opacity-80"
          aria-label="dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
