import { useEffect, useState } from "react";

// Imperative version for non-React callers (route loaders). SSR returns false
// so loaders never take the offline branch on the server.
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

// Hook form. SSR initializes to online=true; on the client the lazy
// initializer reads navigator.onLine immediately, avoiding a wasted render
// in the (common) online case.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
