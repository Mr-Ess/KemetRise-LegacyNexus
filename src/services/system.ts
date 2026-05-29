import { supabase } from "@/integrations/supabase/client";
import { tenantDb, scopedSelect } from "@/lib/tenantDb";

const uid = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
};

// Tasks
export const tasksApi = {
  async list() {
    return await tenantDb.select("tasks", { orderBy: "created_at", ascending: false });
  },
  async create(p: { title: string; status?: string; agent_kind?: string; assignee?: string; priority?: string; description?: string; metadata?: any }) {
    return await tenantDb.insert("tasks", p as any);
  },
  async update(id: string, patch: any) {
    return await tenantDb.update("tasks", patch, { id });
  },
  async remove(id: string) {
    await tenantDb.remove("tasks", { id });
  },
};

// Vault
export const vaultApi = {
  async list() {
    return await tenantDb.select("vault_entries", { orderBy: "created_at", ascending: false });
  },
  async create(p: { label: string; category?: string; payload?: any; threat_level?: number; locked?: boolean }) {
    return await tenantDb.insert("vault_entries", p as any);
  },
  async update(id: string, patch: any) {
    return await tenantDb.update("vault_entries", patch, { id });
  },
  async remove(id: string) {
    await tenantDb.remove("vault_entries", { id });
  },
};

// Dead Man Switch
export const dmsApi = {
  async get() {
    const rows = await tenantDb.select("dead_man_switch", { limit: 1 });
    return rows[0] || null;
  },
  async heartbeat() {
    return await tenantDb.upsert(
      "dead_man_switch",
      { last_heartbeat: new Date().toISOString(), active: true },
      { onConflict: "user_id" },
      { includeClientId: false, includeBrandId: false },
    );
  },
  async update(patch: any) {
    return await tenantDb.upsert(
      "dead_man_switch",
      patch,
      { onConflict: "user_id" },
      { includeClientId: false, includeBrandId: false },
    );
  },
};

// Settings
export const settingsApi = {
  async get(key: string) {
    const rows = await scopedSelect<any>("app_settings", { eq: { key }, limit: 1 });
    return rows[0]?.value ?? null;
  },
  async set(key: string, value: any) {
    return await tenantDb.upsert(
      "app_settings",
      { key, value },
      { onConflict: "user_id,key" },
      { includeClientId: false, includeBrandId: false },
    );
  },
};

// Chat
export const chatApi = {
  async listConversations() {
    return await tenantDb.select("chat_conversations", { orderBy: "updated_at", ascending: false });
  },
  async createConversation(p: { title?: string; agent_kind?: string; metadata?: any }) {
    return await tenantDb.insert("chat_conversations", p as any);
  },
  async deleteConversation(id: string) {
    await tenantDb.remove("chat_messages", { eq: { conversation_id: id } });
    await tenantDb.remove("chat_conversations", { id });
  },
  async listMessages(conversation_id: string) {
    return await tenantDb.select("chat_messages", {
      eq: { conversation_id },
      orderBy: "created_at",
      ascending: true,
    });
  },
  async sendMessage(conversation_id: string, role: string, content: string) {
    const data = await tenantDb.insert("chat_messages", { conversation_id, role, content } as any);
    await tenantDb.update("chat_conversations", { updated_at: new Date().toISOString() }, { id: conversation_id });
    return data;
  },
  async streamAI(messages: { role: string; content: string }[], onChunk: (text: string) => void, system?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, system }),
    });
    if (!resp.ok || !resp.body) {
      const err = await resp.text();
      throw new Error(err || "AI request failed");
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) { full += delta; onChunk(delta); }
        } catch { /* ignore */ }
      }
    }
    return full;
  },
};

// Profile
export const profileApi = {
  async get() {
    const rows = await scopedSelect<any>("profiles", { limit: 1 });
    return rows[0] || null;
  },
  async update(patch: { display_name?: string; avatar_url?: string }) {
    const user_id = await uid();
    return await tenantDb.update("profiles", patch as any, { eq: { user_id } }, { includeUserId: false });
  },
  async uploadAvatar(file: File) {
    const user_id = await uid();
    const ext = file.name.split(".").pop() || "png";
    const path = `${user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    await this.update({ avatar_url: pub.publicUrl });
    return pub.publicUrl;
  },
};

// Roles (admin)
export const rolesApi = {
  async listAll() {
    return await tenantDb.select("user_roles", { orderBy: "created_at", ascending: false });
  },
  async assign(user_id: string, role: "admin" | "moderator" | "user") {
    return await tenantDb.insert("user_roles", { user_id, role } as any, { includeClientId: false, includeBrandId: false, includeUserName: false });
  },
  async remove(id: string) {
    await tenantDb.remove("user_roles", { id }, { includeUserName: false, includeClientId: false, includeBrandId: false });
  },
  async myRoles() {
    const data = await scopedSelect<any>("user_roles", { select: "role" });
    return (data || []).map((r: any) => r.role);
  },
};

// Branches helper for map
export const branchesApi = {
  async list() {
    return await tenantDb.select("branches", { orderBy: "created_at", ascending: false });
  },
};

// Audit logs
export const auditApi = {
  async list(limit = 100) {
    return await tenantDb.select("audit_logs", { orderBy: "created_at", ascending: false, limit });
  },
};

// Transactions
export const transactionsApi = {
  async list() {
    return await tenantDb.select("transactions", { orderBy: "occurred_at", ascending: false });
  },
  async create(p: { amount: number; currency?: string; kind?: "income" | "expense"; category?: string; description?: string; occurred_at?: string }) {
    return await tenantDb.insert("transactions", p as any);
  },
  async remove(id: string) {
    await tenantDb.remove("transactions", { id });
  },
  async summary() {
    const rows: any[] = await this.list();
    const income = rows.filter(r => r.kind === "income").reduce((s, r) => s + Number(r.amount || 0), 0);
    const expense = rows.filter(r => r.kind === "expense").reduce((s, r) => s + Number(r.amount || 0), 0);
    return { income, expense, net: income - expense, count: rows.length, rows };
  },
};

// Heirs (unified with Digital Inheritors — stored in `digital_inheritance` table)
export type Heir = { id: string; name: string; email: string; phone?: string; relation?: string };
export const heirsApi = {
  async list(): Promise<Heir[]> {
    const data = await scopedSelect<any>("digital_inheritance", { select: "id,name,data", orderBy: "created_at", ascending: false });
    return ((data as any[]) || []).map(r => ({
      id: r.id,
      name: r.name,
      email: r.data?.email || "",
      phone: r.data?.phone || "",
      relation: r.data?.relationship || "",
    }));
  },
  async upsert(h: Heir) {
    const user_id = await uid();
    const data = { email: h.email, phone: h.phone, relationship: h.relation };
    if (h.id) {
      await tenantDb.update("digital_inheritance", { name: h.name, data }, { id: h.id });
    } else {
      await tenantDb.insert("digital_inheritance", { user_id, name: h.name, status: "active", data } as any);
    }
  },
  async remove(id: string) {
    await tenantDb.remove("digital_inheritance", { id });
  },
};

// GDPR — export/delete account data
export const gdprApi = {
  async exportAll() {
    const tables = [
      "profiles","user_roles","brands","branches","customers","employees","projects","services",
      "affiliates","success_partners","digital_inheritance","legendary_journey",
      "tasks","vault_entries","dead_man_switch","chat_conversations","chat_messages",
      "transactions","audit_logs","api_keys","webhooks","key_persons","entity_files","app_settings",
    ] as const;
    const result: Record<string, any[]> = {};
    for (const t of tables) {
      const data = await scopedSelect<any>(t as any);
      result[t] = (data as any[]) || [];
    }
    return result;
  },
  async deleteAccount() {
    const u = await uid();
    const tables = [
      "key_persons","entity_files","api_keys","webhooks","app_settings","audit_logs",
      "transactions","chat_messages","chat_conversations","vault_entries","dead_man_switch",
      "tasks","legendary_journey","digital_inheritance","success_partners","affiliates",
      "services","projects","employees","customers","branches","brands","user_roles","profiles",
    ];
    for (const t of tables) {
      await tenantDb.remove(t as any, { eq: { user_id: u } }, { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false });
    }
    await supabase.auth.signOut();
  },
};

// Counts for analytics
export const countsApi = {
  async all() {
    const tables = ["brands","branches","customers","employees","projects","services","affiliates","success_partners","tasks"] as const;
    const results = await Promise.all(tables.map(async (t) => {
      const { count } = await supabase.from(t).select("*", { count: "exact", head: true });
      return [t, count || 0] as const;
    }));
    return Object.fromEntries(results) as Record<typeof tables[number], number>;
  },
};

// ============ Phase A: New APIs ============

// 2FA
export const twofaApi = {
  async get() {
    const u = await uid();
    const rows = await scopedSelect<any>("user_2fa", { eq: { user_id: u }, limit: 1 });
    return (rows[0] || null) as any;
  },
  async upsert(p: { secret: string; enabled?: boolean; backup_codes?: string[] }) {
    return await tenantDb.upsert(
      "user_2fa",
      p as any,
      { onConflict: "user_id" },
      { includeClientId: false, includeBrandId: false, includeUserName: false },
    );
  },
  async disable() {
    const u = await uid();
    await tenantDb.remove("user_2fa", { eq: { user_id: u } }, { includeUserName: false, includeClientId: false, includeBrandId: false });
  },
};

// Backups
export const backupsApi = {
  async list() {
    return await tenantDb.select("backups", { orderBy: "created_at", ascending: false });
  },
  async create(label: string) {
    const snapshot = await gdprApi.exportAll();
    const json = JSON.stringify(snapshot);
    return await tenantDb.insert("backups", { label, snapshot, size_bytes: json.length, status: "ready" } as any);
  },
  async remove(id: string) {
    await tenantDb.remove("backups", { id });
  },
  async download(id: string) {
    const rows = await scopedSelect<any>("backups", { select: "snapshot,label", eq: { id }, limit: 1 });
    return rows[0] || null;
  },
  async restore(id: string) {
    const rows = await scopedSelect<any>("backups", { select: "snapshot", eq: { id }, limit: 1 });
    if (!rows[0]) throw new Error("Backup not found");
    const snap = (rows[0] as any).snapshot as Record<string, any[]>;
    const user_id = await uid();
    const restorable = ["brands","branches","customers","employees","projects","services","affiliates","success_partners","digital_inheritance","legendary_journey","tasks","vault_entries","transactions","app_settings","webhooks","api_keys","key_persons"];
    let restored = 0;
    for (const t of restorable) {
      const rows = (snap[t] || []).filter((r: any) => r.user_id === user_id);
      if (!rows.length) continue;
      const { error: e } = await supabase.from(t as any).upsert(rows as any, { onConflict: "id" });
      if (!e) restored += rows.length;
    }
    return { restored };
  },
};

// Webhook deliveries
export const deliveriesApi = {
  async list(limit = 100) {
    return await tenantDb.select("webhook_deliveries", { orderBy: "created_at", ascending: false, limit });
  },
  async dispatch(event: string, payload: any) {
    const { data, error } = await supabase.functions.invoke("webhook-dispatch", { body: { event, payload } });
    if (error) throw error; return data;
  },
};

// Saved views
export const viewsApi = {
  async list(page: string) {
    return await tenantDb.select("saved_views", { eq: { page }, orderBy: "created_at", ascending: false });
  },
  async create(p: { page: string; name: string; filters: any }) {
    return await tenantDb.insert("saved_views", p as any);
  },
  async remove(id: string) {
    await tenantDb.remove("saved_views", { id });
  },
};

// Team / Brand members & invitations
export const teamApi = {
  async members(brand_id: string) {
    return await tenantDb.select("brand_members", { eq: { brand_id } });
  },
  async invitations(brand_id: string) {
    return await tenantDb.select("brand_invitations", { eq: { brand_id }, orderBy: "created_at", ascending: false });
  },
  async invite(brand_id: string, email: string, role = "member") {
    const invited_by = await uid();
    const token = crypto.randomUUID().replace(/-/g, "");
    return await tenantDb.insert("brand_invitations", { brand_id, invited_by, email, role, token } as any, { includeClientId: false, includeBrandId: false });
  },
  async revoke(id: string) {
    await tenantDb.remove("brand_invitations", { id }, { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false });
  },
  async accept(token: string) {
    const u = await uid();
    const { data, error: e1 } = await supabase.rpc("get_invitation_by_token" as any, { _token: token });
    const inv: any = Array.isArray(data) ? data[0] : data;
    if (e1 || !inv) throw new Error("Invalid or expired invitation");
    try {
      await tenantDb.insert("brand_members", { brand_id: inv.brand_id, user_id: u, role: inv.role } as any, { includeClientId: false, includeBrandId: false });
    } catch (e: any) {
      if (!String(e?.message || "").includes("duplicate")) throw e;
    }
    await tenantDb.update(
      "brand_invitations",
      { accepted_at: new Date().toISOString() },
      { id: inv.id },
      { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false },
    );
    return inv;
  },
  async removeMember(id: string) {
    await tenantDb.remove("brand_members", { id }, { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false });
  },
};

// Push subscriptions
export const pushApi = {
  async subscribe(sub: PushSubscription) {
    const json = sub.toJSON() as any;
    await tenantDb.upsert(
      "push_subscriptions",
      { endpoint: sub.endpoint, p256dh: json.keys.p256dh, auth_key: json.keys.auth, user_agent: navigator.userAgent } as any,
      { onConflict: "user_id,endpoint" },
      { includeClientId: false, includeBrandId: false },
    );
  },
  async unsubscribe(endpoint: string) {
    const u = await uid();
    await tenantDb.remove("push_subscriptions", { eq: { user_id: u, endpoint } }, { includeUserId: false, includeUserName: false, includeClientId: false, includeBrandId: false });
  },
};

// AI Categorize
export const aiApi = {
  async categorize(kind: "transaction" | "task", text: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke("ai-categorize", { body: { kind, text } });
    if (error) throw error;
    return (data as any)?.category || "uncategorized";
  },
};
