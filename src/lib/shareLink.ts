import { toast } from "sonner";

// Lightweight stateless share link encoder (no DB).
// Encodes a read-only payload into a URL hash. Anyone with the link sees the snapshot.
export const buildShareLink = (kind: string, payload: any) => {
  const data = btoa(unescape(encodeURIComponent(JSON.stringify({ kind, payload, ts: Date.now() }))));
  return `${location.origin}/?share=${data}`;
};

export const copyShareLink = async (kind: string, payload: any) => {
  const url = buildShareLink(kind, payload);
  try { await navigator.clipboard.writeText(url); toast.success("Share link copied"); }
  catch { toast.error("Copy failed"); }
};
