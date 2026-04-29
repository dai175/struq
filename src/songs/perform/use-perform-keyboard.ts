import { useEffect, useRef } from "react";
import type { PerformMode } from "@/songs/perform/types";

interface KeyboardHandlers {
  primary: () => void;
  back: () => void;
  reset: () => void;
  exit: () => void;
}

export function usePerformKeyboard(handlers: KeyboardHandlers, mode: PerformMode) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case " ":
        case "ArrowRight":
          e.preventDefault();
          handlersRef.current.primary();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlersRef.current.back();
          break;
        case "r":
        case "R":
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (modeRef.current === "selecting") return;
          e.preventDefault();
          handlersRef.current.reset();
          break;
        case "Escape":
          handlersRef.current.exit();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
