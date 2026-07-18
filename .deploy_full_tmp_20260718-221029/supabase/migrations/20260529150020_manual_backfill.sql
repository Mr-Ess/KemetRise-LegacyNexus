-- 3) Backfill legacy tenant fields

-- Backfill tenant columns for legacy rows.
-- Safe/idempotent: only fills NULLs.

-- 0) Seed tenant access mappings used by RLS predicates
-- Ensures users can read existing rows linked by client_id/brand_id.
DO $$
DECLARE
  brands_has_client_id boolean;
  brands_has_user_name boolean;
  brand_members_exists boolean;
  brand_members_has_user_name boolean;
  member_user_name_expr text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'client_id'
  ) INTO brands_has_client_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'user_name'
  ) INTO brands_has_user_name;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brand_members'
  ) INTO brand_members_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_members' AND column_name = 'user_name'
  ) INTO brand_members_has_user_name;

  IF brands_has_client_id THEN
    EXECUTE format(
      'insert into public.client_brand_access (user_id, client_id, brand_id, is_primary, role, permissions, user_name)
       select b.user_id, b.client_id::text, b.id, true, ''owner'', ''{}''::jsonb, %s
       from public.brands b
       where b.user_id is not null
         and b.client_id is not null
         and b.id is not null
         and not exists (
           select 1 from public.client_brand_access cba
           where cba.user_id = b.user_id
             and cba.client_id = b.client_id::text
             and cba.brand_id = b.id
         )',
      CASE WHEN brands_has_user_name THEN 'b.user_name' ELSE 'null::text' END
    );
  ELSE
    EXECUTE format(
      'insert into public.client_brand_access (user_id, client_id, brand_id, is_primary, role, permissions, user_name)
       select b.user_id, c.id::text, b.id, true, ''owner'', ''{}''::jsonb, %s
       from public.brands b
       join public.clients c on c.user_id = b.user_id
       where b.user_id is not null
         and c.id is not null
         and b.id is not null
         and not exists (
           select 1 from public.client_brand_access cba
           where cba.user_id = b.user_id
             and cba.client_id = c.id::text
             and cba.brand_id = b.id
         )',
      CASE WHEN brands_has_user_name THEN 'b.user_name' ELSE 'null::text' END
    );
  END IF;

  IF brand_members_exists THEN
    member_user_name_expr := CASE WHEN brand_members_has_user_name THEN 'bm.user_name' ELSE 'null::text' END;

    IF brands_has_client_id THEN
      EXECUTE format(
        'insert into public.client_brand_access (user_id, client_id, brand_id, is_primary, role, permissions, user_name)
         select bm.user_id, b.client_id::text, bm.brand_id, false, coalesce(nullif(bm.role, ''''), ''member''), ''{}''::jsonb, %s
         from public.brand_members bm
         join public.brands b on b.id = bm.brand_id
         where bm.user_id is not null
           and b.client_id is not null
           and bm.brand_id is not null
           and not exists (
             select 1 from public.client_brand_access cba
             where cba.user_id = bm.user_id
               and cba.client_id = b.client_id::text
               and cba.brand_id = bm.brand_id
           )',
        member_user_name_expr
      );
    ELSE
      EXECUTE format(
        'insert into public.client_brand_access (user_id, client_id, brand_id, is_primary, role, permissions, user_name)
         select bm.user_id, om.client_id, bm.brand_id, false, coalesce(nullif(bm.role, ''''), ''member''), ''{}''::jsonb, %s
         from public.brand_members bm
         join (
           select cba.brand_id, min(cba.client_id) as client_id
           from public.client_brand_access cba
           where cba.client_id is not null
           group by cba.brand_id
         ) om on om.brand_id = bm.brand_id
         where bm.user_id is not null
           and bm.brand_id is not null
           and not exists (
             select 1 from public.client_brand_access cba
             where cba.user_id = bm.user_id
               and cba.client_id = om.client_id
               and cba.brand_id = bm.brand_id
           )',
        member_user_name_expr
      );
    END IF;
  END IF;
END $$;

-- 1) user_name from clients by user_id where possible
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_name'
      )
  LOOP
    EXECUTE format(
      'update public.%I t
         set user_name = c.user_name
        from public.clients c
       where t.user_name is null
         and t.user_id is not null
         and c.user_id = t.user_id
         and c.user_name is not null',
      r.table_name
    );
  END LOOP;
END $$;

-- 2) client_id / brand_id from client_brand_access for rows with user_id
DO $$
DECLARE
  r record;
  client_type text;
  brand_type text;
  set_parts text;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_id'
      )
      AND (
        EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'client_id'
        )
        OR EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'brand_id'
        )
      )
  LOOP
    SELECT c.data_type INTO client_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'client_id';

    SELECT c.data_type INTO brand_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'brand_id';

    set_parts := '';

    IF client_type IS NOT NULL THEN
      IF client_type = 'uuid' THEN
        set_parts := set_parts ||
          'client_id = coalesce(t.client_id, case when cba.client_id ~ ''^[0-9a-fA-F-]{36}$'' then cba.client_id::uuid else null end),';
      ELSE
        set_parts := set_parts ||
          'client_id = coalesce(t.client_id, cba.client_id),';
      END IF;
    END IF;

    IF brand_type IS NOT NULL THEN
      IF brand_type = 'uuid' THEN
        set_parts := set_parts ||
          'brand_id = coalesce(t.brand_id, cba.brand_id),';
      ELSE
        set_parts := set_parts ||
          'brand_id = coalesce(t.brand_id, cba.brand_id::text),';
      END IF;
    END IF;

    IF set_parts = '' THEN
      CONTINUE;
    END IF;

    set_parts := left(set_parts, length(set_parts) - 1);

    EXECUTE format(
      'update public.%I t
          set %s
         from (
           select distinct on (cba.user_id)
                  cba.user_id,
                  cba.client_id,
                  cba.brand_id
             from public.client_brand_access cba
            where cba.user_id is not null
            order by cba.user_id, cba.is_primary desc nulls last, cba.created_at desc nulls last
         ) cba
        where t.user_id is not null
          and cba.user_id = t.user_id',
      r.table_name,
      set_parts
    );
  END LOOP;
END $$;

-- 3) user_name from clients by client_id (for rows without user_id path)
DO $$
DECLARE
  r record;
  client_type text;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'user_name'
      )
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'client_id'
      )
  LOOP
    SELECT c.data_type INTO client_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = r.table_name AND c.column_name = 'client_id';

    IF client_type = 'uuid' THEN
      EXECUTE format(
        'update public.%I t
            set user_name = c.user_name
           from public.clients c
          where t.user_name is null
            and t.client_id is not null
            and c.id = t.client_id
            and c.user_name is not null',
        r.table_name
      );
    ELSE
      EXECUTE format(
        'update public.%I t
            set user_name = c.user_name
           from public.clients c
          where t.user_name is null
            and t.client_id is not null
            and c.id::text = t.client_id::text
            and c.user_name is not null',
        r.table_name
      );
    END IF;
  END LOOP;
END $$;

-- 4) helper indexes for backfilled tenant filters on known heavy tables
create index if not exists idx_brands_user_name on public.brands(user_name);
create index if not exists idx_projects_user_name on public.projects(user_name);
create index if not exists idx_employees_user_name on public.employees(user_name);
create index if not exists idx_services_user_name on public.services(user_name);
create index if not exists idx_customers_user_name on public.customers(user_name);

