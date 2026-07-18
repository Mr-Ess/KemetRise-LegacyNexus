const CANONICAL_FALLBACK = "https://kemetrise.com/LegacyNexus/";

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function getAppBaseUrl(): string {
  const configured = (import.meta.env.VITE_CANONICAL_BASE_URL as string | undefined)?.trim();
  if (configured) return ensureTrailingSlash(configured);

  if (import.meta.env.PROD) {
    return CANONICAL_FALLBACK;
  }

  if (typeof window !== "undefined") {
    return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  }

  return CANONICAL_FALLBACK;
}

export function toAppUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  return new URL(cleanPath, getAppBaseUrl()).toString();
}

export function getAppOrigin(): string {
  return new URL(getAppBaseUrl()).origin;
}

export function shouldForceCanonicalHost(): boolean {
  if (typeof window === "undefined") return false;
  return import.meta.env.PROD && window.location.hostname.endsWith("lovable.app");
}

export function getCanonicalRedirectUrl(): string {
  if (typeof window === "undefined") return getAppBaseUrl();

  const base = getAppBaseUrl();
  const rawPath = window.location.pathname.replace(/^\/+/, "");
  const normalizedPath = rawPath.startsWith("LegacyNexus/")
    ? rawPath.slice("LegacyNexus/".length)
    : rawPath;
  const queryAndHash = `${window.location.search}${window.location.hash}`;
  return new URL(`${normalizedPath}${queryAndHash}`, base).toString();
}
