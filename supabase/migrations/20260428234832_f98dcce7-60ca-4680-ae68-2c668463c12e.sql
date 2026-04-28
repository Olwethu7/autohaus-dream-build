-- 1) Captcha failures log (server inserts only)
CREATE TABLE IF NOT EXISTS public.captcha_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  reason text NOT NULL,
  ip text,
  email text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_captcha_failures_created ON public.captcha_failures (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_captcha_failures_email ON public.captcha_failures (email);

ALTER TABLE public.captcha_failures ENABLE ROW LEVEL SECURITY;

-- Only admins may read; no client may insert/update/delete.
CREATE POLICY "Admins view captcha failures"
  ON public.captcha_failures
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Admin-only abuse stats RPC
CREATE OR REPLACE FUNCTION public.admin_recent_abuse_stats(_minutes int DEFAULT 60)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _captcha_total int;
  _captcha_by_reason jsonb;
  _enquiry_dupes jsonb;
  _testdrive_dupes jsonb;
  _since timestamptz := now() - make_interval(mins => _minutes);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO _captcha_total
    FROM public.captcha_failures WHERE created_at >= _since;

  SELECT COALESCE(jsonb_object_agg(reason, c), '{}'::jsonb) INTO _captcha_by_reason
    FROM (
      SELECT reason, count(*) AS c
        FROM public.captcha_failures
       WHERE created_at >= _since
       GROUP BY reason
    ) r;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('email', email, 'count', c) ORDER BY c DESC), '[]'::jsonb)
    INTO _enquiry_dupes
    FROM (
      SELECT email, count(*) AS c
        FROM public.enquiries
       WHERE created_at >= _since
       GROUP BY email
       HAVING count(*) >= 3
    ) e;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('email', email, 'count', c) ORDER BY c DESC), '[]'::jsonb)
    INTO _testdrive_dupes
    FROM (
      SELECT email, count(*) AS c
        FROM public.test_drives
       WHERE created_at >= _since
       GROUP BY email
       HAVING count(*) >= 3
    ) t;

  RETURN jsonb_build_object(
    'minutes', _minutes,
    'captcha_failures_total', _captcha_total,
    'captcha_failures_by_reason', _captcha_by_reason,
    'rapid_enquiry_emails', _enquiry_dupes,
    'rapid_testdrive_emails', _testdrive_dupes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_recent_abuse_stats(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recent_abuse_stats(int) TO authenticated;