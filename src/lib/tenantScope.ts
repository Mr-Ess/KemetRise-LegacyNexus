import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type TenantScope = {
  userId: string;
  userName: string | null;
  clientId: string | null;
  brandId: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickString = (source: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const deriveUserName = (user: User): string | null => {
  const userMeta = asRecord(user.user_metadata);
  const appMeta = asRecord(user.app_metadata);
  const fromMeta =
    pickString(userMeta, ["user_name", "username", "full_name", "name"]) ||
    pickString(appMeta, ["user_name", "username", "full_name", "name"]);
  if (fromMeta) return fromMeta;
  if (user.email && user.email.includes("@")) return user.email.split("@")[0];
  return null;
};

export async function getTenantScope(): Promise<TenantScope> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");

  const user = data.user;
  const userMeta = asRecord(user.user_metadata);
  const appMeta = asRecord(user.app_metadata);

  let clientId =
    pickString(userMeta, ["client_id", "clientId"]) ||
    pickString(appMeta, ["client_id", "clientId"]);
  let brandId =
    pickString(userMeta, ["brand_id", "brandId", "current_brand_id", "currentBrandId"]) ||
    pickString(appMeta, ["brand_id", "brandId", "current_brand_id", "currentBrandId"]);

  if (!clientId || !brandId) {
    const { data: access } = await supabase
      .from("client_brand_access")
      .select("client_id, brand_id")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!clientId) clientId = access?.client_id || null;
    if (!brandId) brandId = access?.brand_id || null;
  }

  return {
    userId: user.id,
    userName: deriveUserName(user),
    clientId,
    brandId,
  };
}