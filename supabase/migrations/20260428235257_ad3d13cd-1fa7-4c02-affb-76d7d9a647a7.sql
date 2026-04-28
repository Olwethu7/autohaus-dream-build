-- Remove audit log infrastructure
DROP TRIGGER IF EXISTS trg_audit_vehicles ON public.vehicles;
DROP FUNCTION IF EXISTS public.audit_vehicles() CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action(text, text, uuid, jsonb) CASCADE;
DROP TABLE IF EXISTS public.admin_audit_log CASCADE;

-- Remove abuse / captcha-failure tracking
DROP FUNCTION IF EXISTS public.admin_recent_abuse_stats(int) CASCADE;
DROP TABLE IF EXISTS public.captcha_failures CASCADE;

-- Remove admin user-management RPCs (not in spec)
DROP FUNCTION IF EXISTS public.admin_list_users() CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_admin(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.claim_first_admin() CASCADE;