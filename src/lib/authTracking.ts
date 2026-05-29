// Helpers لتسجيل تسجيل دخول الجلسة وتتبع المحاولات الفاشلة وتقييد brute-force
import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";

const parseUA = () => {
  const ua = navigator.userAgent;
  const browser = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : /Firefox/i.test(ua) ? "Firefox" : "Browser";
  const os = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Linux/i.test(ua) ? "Linux" : "Unknown";
  const device = /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : /Tablet|iPad/i.test(ua) ? "Tablet" : "Desktop";
  return { browser, os, device };
};

export const trackLoginSuccess = async (userId: string) => {
  const { browser, os, device } = parseUA();
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token?.slice(-32) || crypto.randomUUID();
  await Promise.all([
    tenantDb.insert(
      "login_history",
      { user_id: userId, browser, os, device, user_agent: navigator.userAgent, success: true, location: Intl.DateTimeFormat().resolvedOptions().timeZone },
      { includeClientId: false, includeBrandId: false },
    ),
    tenantDb.insert(
      "user_sessions",
      { user_id: userId, session_token: token, browser, os, device, last_active: new Date().toISOString() },
      { includeClientId: false, includeBrandId: false },
    ),
  ]);
};

export const trackFailedLogin = async (email: string) => {
  // Use direct supabase client (no auth required — user is not logged in here)
  await supabase
    .from("failed_login_attempts")
    .insert({ email })
    .then(() => {}); // fire-and-forget, ignore errors silently
};

// Client-side throttle: max 5 failed attempts per email per 15 min
export const checkRateLimit = async (email: string): Promise<{ allowed: boolean; waitMin?: number }> => {
  try {
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("failed_login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("attempted_at", since);
    if (error) return { allowed: true }; // fail open — can't check, allow attempt
    if ((count || 0) >= 5) return { allowed: false, waitMin: 15 };
    return { allowed: true };
  } catch {
    return { allowed: true }; // fail open
  }
};
