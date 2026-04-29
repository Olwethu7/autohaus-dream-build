-- Track admin login attempts for rate limiting
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time
  ON public.admin_login_attempts (ip_address, attempted_at DESC);

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view; nobody can directly insert/update/delete from clients (server functions use service role)
CREATE POLICY "Admins view login attempts"
  ON public.admin_login_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));