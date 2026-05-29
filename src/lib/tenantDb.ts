import { scopedSelect } from "@/lib/tenantRead";
import {
  deleteWithTenant,
  insertWithTenant,
  updateWithTenant,
  upsertWithTenant,
  withTenantPayload,
} from "@/lib/tenantWrite";

export {
  scopedSelect,
  insertWithTenant,
  upsertWithTenant,
  updateWithTenant,
  deleteWithTenant,
  withTenantPayload,
};

export const tenantDb = {
  select: scopedSelect,
  insert: insertWithTenant,
  upsert: upsertWithTenant,
  update: updateWithTenant,
  remove: deleteWithTenant,
  withPayload: withTenantPayload,
};
