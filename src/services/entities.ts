import { supabase } from "@/integrations/supabase/client";
import { tenantDb } from "@/lib/tenantDb";

export type EntityKind =
  | "brands" | "projects" | "services" | "employees" | "customers"
  | "branches" | "affiliates" | "success_partners" | "digital_inheritance" | "legendary_journey";

export type OwnerKind =
  | "brand" | "project" | "service" | "employee" | "customer"
  | "branch" | "affiliate" | "success_partner" | "digital_inheritance" | "legendary_journey";

export const kindToOwner: Record<EntityKind, OwnerKind> = {
  brands: "brand", projects: "project", services: "service", employees: "employee",
  customers: "customer", branches: "branch", affiliates: "affiliate",
  success_partners: "success_partner", digital_inheritance: "digital_inheritance",
  legendary_journey: "legendary_journey",
};

export type EntityRow = {
  id: string;
  user_id: string;
  name: string;
  status: "active" | "inactive" | "maintenance" | "pending";
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export const entitiesApi = {
  async list(kind: EntityKind): Promise<EntityRow[]> {
    const scoped = (await tenantDb.select(kind as any, { orderBy: "created_at", ascending: false })) as any;
    if (kind !== "employees") return scoped;

    // Legacy datasets may be split by owner while team members should still see all
    // employee rows permitted by RLS. If scoped read looks partial, retry via direct
    // table read and keep the larger result set.
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return scoped;
    const allRows = (data || []) as EntityRow[];
    return allRows.length > scoped.length ? allRows : scoped;
  },
  async get(kind: EntityKind, id: string): Promise<EntityRow | null> {
    const rows = await tenantDb.select(kind as any, { eq: { id }, limit: 1 });
    return (rows[0] || null) as any;
  },
  async create(kind: EntityKind, payload: { name: string; status?: string; data?: any; brand_id?: string | null; [key: string]: any }): Promise<EntityRow> {
    const { name, status, data, brand_id, ...extraCols } = payload;
    const row: any = { name, status: (status as any) || "active", data: data || {}, ...extraCols };
    if (brand_id !== undefined && ["branches","employees","projects","services"].includes(kind)) row.brand_id = brand_id || null;
    return (await tenantDb.insert(kind as any, row)) as any;
  },
  async update(kind: EntityKind, id: string, patch: Record<string, any>): Promise<EntityRow> {
    return (await tenantDb.update(kind as any, patch as any, { id })) as any;
  },
  async remove(kind: EntityKind, id: string): Promise<void> {
    await tenantDb.remove(kind as any, { id });
  },
};

// ===== Polymorphic sub-resources =====
export const keyPersonsApi = {
  async list(owner_kind: OwnerKind, owner_id: string) {
    return await tenantDb.select("key_persons", {
      eq: { owner_kind, owner_id },
      orderBy: "position",
      ascending: true,
    });
  },
  async upsertMany(owner_kind: OwnerKind, owner_id: string, items: any[]) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not authenticated");
    await tenantDb.remove("key_persons", { eq: { owner_kind, owner_id } });
    if (!items.length) return [];
    const baseRows = items.map((it, idx) => ({
      user_id: u.user!.id, owner_kind, owner_id,
      name: it.name || "", role: it.role || null,
      phones: it.phones || [], emails: it.emails || [],
      socials: it.socials || [], channels: it.channels || [], position: idx,
    }));
    const rows = await Promise.all(baseRows.map((row) => tenantDb.withPayload(row, { includeClientId: false, includeBrandId: false })));
    const created = await Promise.all(
      rows.map((row) => tenantDb.insert("key_persons", row, { includeClientId: false, includeBrandId: false }))
    );
    return created || [];
  },
};

export const apiKeysApi = {
  async list(owner_kind: OwnerKind, owner_id: string) {
    return await tenantDb.select("api_keys", {
      eq: { owner_kind, owner_id },
      orderBy: "created_at",
      ascending: false,
    });
  },
  async create(owner_kind: OwnerKind, owner_id: string, label: string) {
    const key_value = `kr_${owner_kind}_${crypto.randomUUID().replace(/-/g, "")}`;
    return await tenantDb.insert("api_keys", { owner_kind, owner_id, label, key_value }, { includeClientId: false, includeBrandId: false });
  },
  async remove(id: string) {
    await tenantDb.remove("api_keys", { id });
  },
};

export const webhooksApi = {
  async list(owner_kind: OwnerKind, owner_id: string) {
    return await tenantDb.select("webhooks", {
      eq: { owner_kind, owner_id },
      orderBy: "created_at",
      ascending: false,
    });
  },
  async create(owner_kind: OwnerKind, owner_id: string, payload: { label: string; url: string; events?: string[] }) {
    return await tenantDb.insert(
      "webhooks",
      { owner_kind, owner_id, label: payload.label, url: payload.url, events: payload.events || [] },
      { includeClientId: false, includeBrandId: false },
    );
  },
  async remove(id: string) {
    await tenantDb.remove("webhooks", { id });
  },
};

export const filesApi = {
  async list(owner_kind: OwnerKind, owner_id: string) {
    return await tenantDb.select("entity_files", {
      eq: { owner_kind, owner_id },
      orderBy: "created_at",
      ascending: false,
    });
  },
  async upload(owner_kind: OwnerKind, owner_id: string, file: File, category?: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not authenticated");
    const path = `${u.user.id}/${owner_kind}/${owner_id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("entity-files").upload(path, file);
    if (upErr) throw upErr;
    return await tenantDb.insert(
      "entity_files",
      {
        user_id: u.user.id,
        owner_kind,
        owner_id,
        file_name: file.name,
        file_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        category: category || null,
      },
      { includeClientId: false, includeBrandId: false },
    );
  },
  async remove(id: string, file_path: string) {
    await supabase.storage.from("entity-files").remove([file_path]);
    await tenantDb.remove("entity_files", { id });
  },
  async signedUrl(file_path: string) {
    const { data, error } = await supabase.storage.from("entity-files").createSignedUrl(file_path, 3600);
    if (error) throw error; return data.signedUrl;
  },
};
