import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return "45 80% 52%";
  const [r, g, b] = m.map(x => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useWhiteLabel() {
  useEffect(() => {
    (async () => {
      try {
        const rows = await tenantDb.select("white_label", { limit: 1 });
        const data = rows[0] || null;
        if (!data) return;
        const wl: any = data;
        const root = document.documentElement;
        if (wl.primary_color) root.style.setProperty("--primary", hexToHsl(wl.primary_color));
        if (wl.accent_color) root.style.setProperty("--accent", hexToHsl(wl.accent_color));
        if (wl.brand_name) document.title = wl.brand_name;
      } catch {
        // Ignore when there is no authenticated user yet.
      }
    })();
  }, []);
}
