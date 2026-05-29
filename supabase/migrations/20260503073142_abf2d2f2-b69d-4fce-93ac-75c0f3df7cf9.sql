
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.entity_status AS ENUM ('active', 'inactive', 'maintenance', 'pending');
CREATE TYPE public.owner_kind AS ENUM ('brand','project','service','employee','customer','branch','affiliate','success_partner','digital_inheritance','legendary_journey');

-- ============ UTILITY: updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AUTO PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ENTITY TABLES (10) ============
-- Generic shape: id, user_id (owner), name, status, data (jsonb dynamic), timestamps
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['brands','projects','services','employees','customers','branches','affiliates','success_partners','digital_inheritance','legendary_journey'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE TABLE public.%I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        status public.entity_status NOT NULL DEFAULT ''active'',
        data JSONB NOT NULL DEFAULT ''{}''::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "owner_select" ON public.%I FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),''admin''));', t);
    EXECUTE format('CREATE POLICY "owner_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "owner_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),''admin''));', t);
    EXECUTE format('CREATE POLICY "owner_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(),''admin''));', t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
    EXECUTE format('CREATE INDEX idx_%I_user ON public.%I(user_id);', t, t);
  END LOOP;
END$$;

-- ============ POLYMORPHIC: KEY PERSONS ============
CREATE TABLE public.key_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_kind public.owner_kind NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  phones JSONB NOT NULL DEFAULT '[]'::jsonb,
  emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  socials JSONB NOT NULL DEFAULT '[]'::jsonb,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.key_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kp_owner_all" ON public.key_persons FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_kp_owner ON public.key_persons(owner_kind, owner_id);
CREATE TRIGGER trg_kp_updated BEFORE UPDATE ON public.key_persons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POLYMORPHIC: ENTITY FILES ============
CREATE TABLE public.entity_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_kind public.owner_kind NOT NULL,
  owner_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ef_owner_all" ON public.entity_files FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ef_owner ON public.entity_files(owner_kind, owner_id);

-- ============ POLYMORPHIC: API KEYS ============
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_kind public.owner_kind NOT NULL,
  owner_id UUID NOT NULL,
  label TEXT NOT NULL,
  key_value TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ak_owner_all" ON public.api_keys FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ak_owner ON public.api_keys(owner_kind, owner_id);

-- ============ POLYMORPHIC: WEBHOOKS ============
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_kind public.owner_kind NOT NULL,
  owner_id UUID NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh_owner_all" ON public.webhooks FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_wh_owner ON public.webhooks(owner_kind, owner_id);
CREATE TRIGGER trg_wh_updated BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('entity-files','entity-files', false) ON CONFLICT DO NOTHING;

CREATE POLICY "users_read_own_files" ON storage.objects FOR SELECT
  USING (bucket_id = 'entity-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users_upload_own_files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'entity-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users_update_own_files" ON storage.objects FOR UPDATE
  USING (bucket_id = 'entity-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users_delete_own_files" ON storage.objects FOR DELETE
  USING (bucket_id = 'entity-files' AND auth.uid()::text = (storage.foldername(name))[1]);
