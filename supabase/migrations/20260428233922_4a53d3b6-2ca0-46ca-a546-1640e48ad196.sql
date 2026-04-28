-- Lock down EXECUTE on SECURITY DEFINER functions.
-- Revoke broad PUBLIC execute (Postgres default) on all our SECURITY DEFINER funcs,
-- then grant EXECUTE narrowly to roles that should call them.

-- Internal trigger function — never called directly by clients.
REVOKE ALL ON FUNCTION public.audit_vehicles() FROM PUBLIC, anon, authenticated;

-- Helper used as trigger; not callable by clients.
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Internal logger — only called from other SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION public.log_admin_action(text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies (which evaluate with table owner rights),
-- so revoke direct client EXECUTE while keeping policy usage intact.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- Authenticated may still need to call it from RPC — keep grant minimal.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Admin RPCs: only signed-in users can attempt; the function body re-checks admin role.
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated;

-- claim_first_admin: any signed-in user may call once; body enforces "no admin yet".
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;