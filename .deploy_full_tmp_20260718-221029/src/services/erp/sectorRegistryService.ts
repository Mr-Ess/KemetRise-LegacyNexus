import { supabase } from "@/integrations/supabase/client";

export interface SectorEntry {
  code: string;
  label: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSectorDto {
  code: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
  sort_order?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function listSectors(): Promise<SectorEntry[]> {
  const { data, error } = await db
    .from('erp_sector_registry')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createSector(dto: CreateSectorDto): Promise<SectorEntry> {
  const { data, error } = await db
    .from('erp_sector_registry')
    .insert(dto)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSector(code: string, patch: Partial<Omit<SectorEntry, 'code' | 'created_at'>>): Promise<SectorEntry> {
  const { data, error } = await db
    .from('erp_sector_registry')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('code', code)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSector(code: string): Promise<void> {
  const { error } = await db.from('erp_sector_registry').delete().eq('code', code);
  if (error) throw error;
}
