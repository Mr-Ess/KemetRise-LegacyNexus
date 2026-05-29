import { supabase } from "@/integrations/supabase/client";
import { getTenantScope } from "@/lib/tenantScope";

type TenantKey = "brand_id" | "client_id" | "user_name" | "user_id";

type ScopedSelectOptions = {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  eq?: Record<string, string | number | boolean | null | undefined>;
  ilike?: { column: string; value: string };
};

const missingColumnRegex = /column\s+"([^"]+)"\s+does not exist/i;

const getMissingColumn = (error: any): string | null => {
  const msg = String(error?.message || "");
  const m = msg.match(missingColumnRegex);
  return m?.[1] || null;
};

export async function scopedSelect<T = any>(table: string, opts: ScopedSelectOptions = {}): Promise<T[]> {
  let scope: Awaited<ReturnType<typeof getTenantScope>> | null = null;
  try {
    scope = await getTenantScope();
  } catch {
    scope = null;
  }

  // Prefer user_id first so legacy rows without brand/client linkage remain visible
  // to their owner while still keeping tenant-safe scoped access.
  const filters: Array<{ key: TenantKey; value: string | null }> = [
    { key: "user_id", value: scope?.userId || null },
    { key: "brand_id", value: scope?.brandId || null },
    { key: "client_id", value: scope?.clientId || null },
    { key: "user_name", value: scope?.userName || null },
  ].filter((f) => !!f.value) as Array<{ key: TenantKey; value: string }>;

  const merged: T[] = [];
  const seen = new Set<string>();

  const appendUnique = (rows: T[]) => {
    for (const row of rows) {
      const rowId = String((row as any)?.id || "");
      if (rowId && seen.has(rowId)) continue;
      if (rowId) seen.add(rowId);
      merged.push(row);
    }
  };

  for (const candidate of filters) {
    const ignored = new Set<string>();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      let q: any = supabase.from(table as any).select(opts.select || "*");

      if (opts.eq) {
        for (const [k, v] of Object.entries(opts.eq)) {
          if (v === undefined || ignored.has(k)) continue;
          q = v === null ? q.is(k, null) : q.eq(k, v as any);
        }
      }

      if (opts.ilike && !ignored.has(opts.ilike.column)) {
        q = q.ilike(opts.ilike.column, opts.ilike.value);
      }

      if (!ignored.has(candidate.key)) {
        q = q.eq(candidate.key, candidate.value);
      }

      if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
      if (opts.limit) q = q.limit(opts.limit);

      const { data, error } = await q;
      if (!error) {
        const rows = (data || []) as T[];
        appendUnique(rows);
        if (opts.limit && merged.length >= opts.limit) return merged.slice(0, opts.limit);
        break;
      }

      const missing = getMissingColumn(error);
      if (missing) {
        ignored.add(missing);
        continue;
      }

      throw error;
    }
  }

  if (merged.length > 0) return opts.limit ? merged.slice(0, opts.limit) : merged;

  // Fallback for tables that do not include tenant columns.
  const ignored = new Set<string>();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let q: any = supabase.from(table as any).select(opts.select || "*");

    if (opts.eq) {
      for (const [k, v] of Object.entries(opts.eq)) {
        if (v === undefined || ignored.has(k)) continue;
        q = v === null ? q.is(k, null) : q.eq(k, v as any);
      }
    }

    if (opts.ilike && !ignored.has(opts.ilike.column)) {
      q = q.ilike(opts.ilike.column, opts.ilike.value);
    }

    if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
    if (opts.limit) q = q.limit(opts.limit);

    const { data, error } = await q;
    if (!error) return (data || []) as T[];

    const missing = getMissingColumn(error);
    if (missing) {
      ignored.add(missing);
      continue;
    }

    throw error;
  }

  return [];
}
