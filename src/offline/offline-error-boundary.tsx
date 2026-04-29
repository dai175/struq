import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { clientLogger } from "@/lib/client-logger";
import { useOnlineStatus } from "@/offline/use-online-status";

interface OfflineErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

function goBack() {
  if (typeof window === "undefined") return;
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.assign("/");
  }
}

// Replaces TanStack Router's default error UI with a Broadcast Console-styled
// message that adapts to navigator.onLine.
export function OfflineErrorBoundary({ error, reset }: OfflineErrorBoundaryProps) {
  const online = useOnlineStatus();
  const { t } = useI18n();

  // Effect (not render) so reactive re-renders don't log the same error twice.
  useEffect(() => {
    clientLogger.error("routeError", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background: "var(--color-ink)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="flex max-w-md flex-col items-center text-center" style={{ gap: 18 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: online ? "var(--color-dim-2)" : "#eab308",
          }}
        >
          {online ? "Error" : "Offline"}
        </span>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, color: "var(--color-text-strong)" }}>
          {online ? t.errorBoundary.onlineTitle : t.errorBoundary.offlineTitle}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-dim)" }}>
          {online ? t.errorBoundary.onlineMessage : t.errorBoundary.offlineMessage}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              padding: "10px 18px",
              border: "1px solid var(--color-line)",
              background: "transparent",
              color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            {t.errorBoundary.back}
          </button>
          {online && (
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 18px",
                border: "1px solid var(--color-accent)",
                background: "var(--color-accent)",
                color: "var(--color-text-on-accent)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: 2,
              }}
            >
              {t.errorBoundary.retry}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
