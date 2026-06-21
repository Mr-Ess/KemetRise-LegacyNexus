import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "superadmin" | "admin" | "manager" | "staff" | "provider" | "partner" | "agent" | "vendor" | "marketing" | "viewer" | "user";

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  country?: string;
  preferred_lang: "ar" | "en";
  preferred_theme: "dark" | "light";
  bio?: string;
  is_verified: boolean;
  is_suspended: boolean;
  onboarding_done: boolean;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  category?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  is_approved: boolean;
  commission_rate: number;
  total_revenue: number;
  total_orders: number;
  rating: number;
}

interface UserRoleCtx {
  profile: UserProfile | null;
  providerProfile: ProviderProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isProvider: boolean;
  isUser: boolean;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProviderProfile: (data: Partial<ProviderProfile>) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultCtx: UserRoleCtx = {
  profile: null, providerProfile: null,
  role: "user", isAdmin: false, isProvider: false, isUser: true,
  loading: true,
  updateProfile: async () => {}, updateProviderProfile: async () => {}, refresh: async () => {},
};

const RoleContext = createContext<UserRoleCtx>(defaultCtx);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const db = supabase as any;
  // Track last loaded userId so token-refresh events don't trigger redundant loads
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      lastLoadedUserIdRef.current = null;
      setProfile(null);
      setProviderProfile(null);
      setLoading(false);
      return;
    }
    // Skip reload if same user is already loaded (e.g. TOKEN_REFRESHED event)
    if (user.id === lastLoadedUserIdRef.current && profile !== null) return;
    setLoading(true);
    try {
      // Load user profile
      const { data: prof } = await db
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        // If this user has role='user' and there are no admins, promote them to superadmin
        if (prof.role === "user") {
          try {
            const { count: adminCount } = await db
              .from("user_profiles")
              .select("*", { count: "exact", head: true })
              .in("role", ["admin", "superadmin"]);
            if ((adminCount ?? 0) === 0) {
              await db.from("user_profiles").update({ role: "superadmin" }).eq("id", user.id);
              prof.role = "superadmin";
            }
          } catch { /* non-fatal */ }
        }
        lastLoadedUserIdRef.current = user.id;
        setProfile(prof as UserProfile);
        // Load provider profile if provider role
        if (prof.role === "provider" || prof.role === "admin") {
          const { data: prov } = await db
            .from("provider_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          setProviderProfile(prov || null);
        }
      } else {
        // First user in the system becomes superadmin automatically
        let defaultRole: UserRole = "user";
        try {
          const { count: adminCount } = await db
            .from("user_profiles")
            .select("*", { count: "exact", head: true })
            .in("role", ["admin", "superadmin"]);
          if ((adminCount ?? 0) === 0) defaultRole = "superadmin";
        } catch { /* fallback to user */ }

        // Create profile if doesn't exist yet
        const newProfile = {
          id: user.id,
          role: defaultRole,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "",
          avatar_url: user.user_metadata?.avatar_url || "",
          preferred_lang: "ar" as const,
          preferred_theme: "dark" as const,
          is_verified: false,
          is_suspended: false,
          onboarding_done: false,
        };
        await db.from("user_profiles").upsert(newProfile);
        lastLoadedUserIdRef.current = user.id;
        setProfile(newProfile as UserProfile);
      }
    } catch {
      // Graceful fallback — only if no valid profile is already loaded
      // (prevents token-refresh errors from downgrading an existing superadmin to "user")
      setProfile(prev => prev ?? {
        id: user.id,
        role: "user",
        full_name: user.user_metadata?.full_name || user.email || "",
        preferred_lang: "ar",
        preferred_theme: "dark",
        is_verified: false,
        is_suspended: false,
        onboarding_done: false,
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => { load(); }, [load]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await db.from("user_profiles").update(data).eq("id", user.id);
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const updateProviderProfile = async (data: Partial<ProviderProfile>) => {
    if (!user) return;
    await db.from("provider_profiles").upsert({ ...data, user_id: user.id });
    setProviderProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const role = profile?.role ?? "user";

  return (
    <RoleContext.Provider value={{
      profile, providerProfile, role,
      isAdmin: role === "admin" || role === "superadmin",
      isProvider: role === "provider" || role === "vendor",
      isUser: role === "user",
      loading,
      updateProfile, updateProviderProfile,
      refresh: load,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

/** Alias for useRole — used by RoleProtectedRoute and other components */
export function useUserRole() {
  return useContext(RoleContext);
}
