import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const SHORTCUTS = [
  { keys: "⌘ / Ctrl + K", desc: "Focus global search" },
  { keys: "?", desc: "Show this dialog" },
  { keys: "Esc", desc: "Clear search / close" },
  { keys: "G then D", desc: "Go to Dashboard" },
  { keys: "G then T", desc: "Go to Team" },
  { keys: "G then S", desc: "Go to Settings" },
];

export const ShortcutsDialog = () => {
  const [open, setOpen] = useState(false);
  useKeyboardShortcuts({ "?": () => setOpen(o => !o) });

  // simple "g then x" sequence
  useEffect(() => {
    let last = 0; let pending = false;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key.toLowerCase() === "g") { pending = true; last = Date.now(); return; }
      if (pending && Date.now() - last < 1000) {
        pending = false;
        const map: Record<string, string> = { d: "/", t: "/team", s: "/settings" };
        const path = map[e.key.toLowerCase()];
        if (path) window.location.assign(path);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display text-primary tracking-wider">KEYBOARD SHORTCUTS</DialogTitle></DialogHeader>
        <div className="divide-y divide-border">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between py-2">
              <span className="text-sm font-body text-foreground">{s.desc}</span>
              <kbd className="px-2 py-1 text-[11px] font-display bg-secondary border border-border rounded text-primary">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsDialog;
