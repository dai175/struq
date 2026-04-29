import { useOnlineStatus } from "./use-online-status";

// Visually hidden status region that announces network state changes to
// screen readers. The visible offline cue lives on the Logomark colour, but
// SR users need an explicit announcement when connectivity flips.
export function OfflineAnnouncer() {
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {online ? "" : "Offline"}
    </div>
  );
}
