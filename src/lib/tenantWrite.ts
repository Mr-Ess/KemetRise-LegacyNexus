import { supabase } from "@/integrations/supabase/client";
import { getTenantScope } from "@/lib/tenantScope";

type TenantWriteOptions = {
  includeUserId?: boolean;
  includeUserName?: boolean;
  includeClientId?: boolean;
  includeBrandId?: boolean;
};

type ScopedWhere = {
  id?: string | number;
  eq?: Record<string, string | number | boolean | null | undefined>;
  in?: Record<string, Array<string | number>>;
};

type ScopedUpdateOptions = TenantWriteOptions & {
  includeTenantInPatch?: boolean;
};

const unknownColumnRegex = /column\s+"([^"]+)"\s+of\s+relation|column\s+"([^"]+)"/i;

const getUnknownColumn = (error: any): string | null => {
  const msg = String(error?.message || "");
  const match = msg.match(unknownColumnRegex);
  return match?.[1] || match?.[2] || null;
};

export async function withTenantPayload(payload: Record<string, any>, opts: TenantWriteOptions = {}) {
  const {
    includeUserId = true,
    includeUserName = true,
    includeClientId = true,
    includeBrandId = true,
  } = opts;

  const scope = await getTenantScope();
  return {
    ...payload,
    ...(includeUserId && payload.user_id === undefined ? { user_id: scope.userId } : {}),
    ...(includeUserName && payload.user_name === undefined && scope.userName ? { user_name: scope.userName } : {}),
    ...(includeClientId && payload.client_id === undefined && scope.clientId ? { client_id: scope.clientId } : {}),
    ...(includeBrandId && payload.brand_id === undefined && scope.brandId ? { brand_id: scope.brandId } : {}),
  };
}

export async function insertWithTenant(
  table: string,
  payload: Record<string, any>,
  opts: TenantWriteOptions = {},
) {
  let row = await withTenantPayload(payload, opts);

  for (let i = 0; i < 5; i += 1) {
    const { data, error } = await supabase.from(table as any).insert(row as any).select();
    if (!error) return Array.isArray(data) ? (data[0] || null) : data;

    const unknown = getUnknownColumn(error);
    if (unknown && Object.prototype.hasOwnProperty.call(row, unknown)) {
      const { [unknown]: _drop, ...rest } = row;
      row = rest;
      continue;
    }

    throw error;
  }

  throw new Error(`Failed to insert into ${table}`);
}

export async function upsertWithTenant(
  table: string,
  payload: Record<string, any>,
  upsertOptions?: { onConflict?: string },
  opts: TenantWriteOptions = {},
) {
  let row = await withTenantPayload(payload, opts);

  for (let i = 0; i < 5; i += 1) {
    const { data, error } = await supabase
      .from(table as any)
      .upsert(row as any, upsertOptions)
      .select();

    if (!error) return Array.isArray(data) ? (data[0] || null) : data;

    const unknown = getUnknownColumn(error);
    if (unknown && Object.prototype.hasOwnProperty.call(row, unknown)) {
      const { [unknown]: _drop, ...rest } = row;
      row = rest;
      continue;
    }

    throw error;
  }

  throw new Error(`Failed to upsert ${table}`);
}

export async function updateWithTenant(
  table: string,
  patch: Record<string, any>,
  where: ScopedWhere,
  opts: ScopedUpdateOptions = {},
) {
  const {
    includeUserId = true,
    includeUserName = true,
    includeClientId = true,
    includeBrandId = true,
    includeTenantInPatch = false,
  } = opts;

  const scope = await getTenantScope();
  let row = includeTenantInPatch
    ? await withTenantPayload(patch, { includeUserId, includeUserName, includeClientId, includeBrandId })
    : { ...patch };

  const tenantFilters: Record<string, string | null> = {
    brand_id: includeBrandId ? scope.brandId : null,
    client_id: includeClientId ? scope.clientId : null,
    user_name: includeUserName ? scope.userName : null,
    user_id: includeUserId ? scope.userId : null,
  };

  const ignored = new Set<string>();
  for (let i = 0; i < 8; i += 1) {
    let q: any = supabase.from(table as any).update(row as any);

    if (where.id !== undefined) q = q.eq("id", where.id as any);
    if (where.eq) {
      for (const [k, v] of Object.entries(where.eq)) {
        if (v === undefined || ignored.has(k)) continue;
        q = v === null ? q.is(k, null) : q.eq(k, v as any);
      }
    }
    if (where.in) {
      for (const [k, values] of Object.entries(where.in)) {
        if (!values?.length || ignored.has(k)) continue;
        q = q.in(k, values as any);
      }
    }

    for (const [k, v] of Object.entries(tenantFilters)) {
      if (!v || ignored.has(k)) continue;
      q = q.eq(k, v as any);
    }

    const { data, error } = await q.select();
    if (!error) return Array.isArray(data) ? (data[0] || null) : data;

    const unknown = getUnknownColumn(error);
    if (unknown) {
      if (Object.prototype.hasOwnProperty.call(row, unknown)) {
        const { [unknown]: _drop, ...rest } = row;
        row = rest;
      }
      ignored.add(unknown);
      continue;
    }

    throw error;
  }

  throw new Error(`Failed to update ${table}`);
}

export async function deleteWithTenant(
  table: string,
  where: ScopedWhere,
  opts: TenantWriteOptions = {},
) {
  const {
    includeUserId = true,
    includeUserName = true,
    includeClientId = true,
    includeBrandId = true,
  } = opts;

  const scope = await getTenantScope();
  const tenantFilters: Record<string, string | null> = {
    brand_id: includeBrandId ? scope.brandId : null,
    client_id: includeClientId ? scope.clientId : null,
    user_name: includeUserName ? scope.userName : null,
    user_id: includeUserId ? scope.userId : null,
  };

  const ignored = new Set<string>();
  for (let i = 0; i < 8; i += 1) {
    let q: any = supabase.from(table as any).delete();

    if (where.id !== undefined) q = q.eq("id", where.id as any);
    if (where.eq) {
      for (const [k, v] of Object.entries(where.eq)) {
        if (v === undefined || ignored.has(k)) continue;
        q = v === null ? q.is(k, null) : q.eq(k, v as any);
      }
    }
    if (where.in) {
      for (const [k, values] of Object.entries(where.in)) {
        if (!values?.length || ignored.has(k)) continue;
        q = q.in(k, values as any);
      }
    }

    for (const [k, v] of Object.entries(tenantFilters)) {
      if (!v || ignored.has(k)) continue;
      q = q.eq(k, v as any);
    }

    const { error } = await q;
    if (!error) return;

    const unknown = getUnknownColumn(error);
    if (unknown) {
      ignored.add(unknown);
      continue;
    }

    throw error;
  }

  throw new Error(`Failed to delete from ${table}`);
}
