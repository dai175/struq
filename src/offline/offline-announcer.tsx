import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/offline/use-online-status";

// Visually hidden status region. Stays silent on first paint, then announces
// both directions of the transition (offline → online and back) so screen
// readers don't miss recovery.
export function OfflineAnnouncer() {
  const online = useOnlineStatus();
  const [message, setMessage] = useState("");
  const seenInitial = useRef(false);

  useEffect(() => {
    if (!seenInitial.current) {
      seenInitial.current = true;
      return;
    }
    setMessage(online ? "Online" : "Offline");
  }, [online]);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
