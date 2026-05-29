DROP POLICY IF EXISTS bi_public_read_by_token ON public.brand_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid, brand_id uuid, email text, role text,
  expires_at timestamptz, accepted_at timestamptz, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, brand_id, email, role, expires_at, accepted_at, created_at
  FROM public.brand_invitations
  WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_brand_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_brand_member(uuid, uuid) TO authenticated;