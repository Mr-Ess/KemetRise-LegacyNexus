import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/context/UserRoleContext";
import { PAGE_PERMS, type AppRole } from "@/lib/permissions";

export interface PagePerm {
  path:          string;
  allowed_roles: string[];
  is_public:     boolean;
  label_en?:     string;
  label_ar?:     string;
}

export function usePagePerms() {
  const { user }              = useAuth();
  const { role }              = useUserRole();
  const [perms, setPerms]     = useState<PagePerm[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = role === "superadmin";

  const loadPerms = useCallback(async () => {
    const db = supabase as any;
    try {
      const { data } = await db
        .from("page_permissions")
        .select("path,allowed_roles,is_public,label_en,label_ar");
      if (data?.length) setPerms(data);
    } catch {
      // silently fall back to static map
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadPerms();
    else setLoading(false);
  }, [user, loadPerms]);

  /** Check if the current user can access a given path */
  const canAccess = useCallback(
    (path: string): boolean => {
      if (!user)         return false;
      if (isSuperAdmin)  return true;

      // Exact-match or prefix match in DB perms
      const dbPerm = perms.find(
        p => path === p.path || (path.startsWith(p.path) && p.path !== "/")
      );
      if (dbPerm) {
        return dbPerm.is_public || dbPerm.allowed_roles.includes(role as string);
      }

      // Fall back to static map
      const staticRoles = PAGE_PERMS[path];
      if (!staticRoles) return true; // not restricted
      return staticRoles.includes(role as AppRole);
    },
    [user, isSuperAdmin, perms, role]
  );

  return { perms, loading, canAccess, isSuperAdmin, reload: loadPerms };
}
