import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

export const useKeyboardShortcuts = (map: Record<string, Handler>) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      const key = (mod ? "mod+" : "") + e.key.toLowerCase();
      const handler = map[key];
      if (!handler) return;
      // allow mod+k even when in input
      if (isInput && !mod && e.key !== "Escape") return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);
};
