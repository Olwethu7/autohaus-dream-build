-- 1. Extend vehicles with extra spec fields
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS drivetrain text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS co2_emissions integer,
  ADD COLUMN IF NOT EXISTS road_tax_band text,
  ADD COLUMN IF NOT EXISTS mot_expiry date;

-- 2. Audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,            -- e.g. 'role.grant', 'role.revoke', 'vehicle.create'
  entity_type text NOT NULL,       -- 'user' | 'vehicle'
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins view audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No insert/update/delete policies: only SECURITY DEFINER functions write to it.

-- 3. Internal helper to write an audit row (SECURITY DEFINER, admin-only)
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _details jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  VALUES (auth.uid(), _email, _action, _entity_type, _entity_id, COALESCE(_details, '{}'::jsonb));
END;
$$;

-- 4. Update admin_set_admin to record promotion/revocation
CREATE OR REPLACE FUNCTION public.admin_set_admin(_user_id uuid, _make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT email INTO _target_email FROM auth.users WHERE id = _user_id;
  IF _make_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    PERFORM public.log_admin_action('role.grant', 'user', _user_id,
      jsonb_build_object('role', 'admin', 'target_email', _target_email));
  ELSE
    IF _user_id = auth.uid() THEN
      RAISE EXCEPTION 'You cannot remove your own admin role';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
    PERFORM public.log_admin_action('role.revoke', 'user', _user_id,
      jsonb_build_object('role', 'admin', 'target_email', _target_email));
  END IF;
END;
$$;

-- 5. Vehicle audit triggers
CREATE OR REPLACE FUNCTION public.audit_vehicles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  -- Only log when an admin is acting (skip system jobs without auth.uid())
  IF auth.uid() IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
    VALUES (auth.uid(), _email, 'vehicle.create', 'vehicle', NEW.id,
      jsonb_build_object('make', NEW.make, 'model', NEW.model, 'year', NEW.year, 'price', NEW.price));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
    VALUES (auth.uid(), _email, 'vehicle.update', 'vehicle', NEW.id,
      jsonb_build_object(
        'make', NEW.make, 'model', NEW.model, 'year', NEW.year, 'price', NEW.price,
        'sold_changed', (OLD.sold IS DISTINCT FROM NEW.sold),
        'price_changed', (OLD.price IS DISTINCT FROM NEW.price),
        'old_price', OLD.price, 'new_price', NEW.price
      ));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
    VALUES (auth.uid(), _email, 'vehicle.delete', 'vehicle', OLD.id,
      jsonb_build_object('make', OLD.make, 'model', OLD.model, 'year', OLD.year, 'price', OLD.price));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_vehicles_ins ON public.vehicles;
DROP TRIGGER IF EXISTS trg_audit_vehicles_upd ON public.vehicles;
DROP TRIGGER IF EXISTS trg_audit_vehicles_del ON public.vehicles;
CREATE TRIGGER trg_audit_vehicles_ins AFTER INSERT ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_vehicles();
CREATE TRIGGER trg_audit_vehicles_upd AFTER UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_vehicles();
CREATE TRIGGER trg_audit_vehicles_del AFTER DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_vehicles();

-- 6. Lock down public form inserts — only server functions (service role) may insert
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Public submit test drives" ON public.test_drives;
DROP POLICY IF EXISTS "Public submit sell requests" ON public.sell_requests;
-- (No replacement INSERT policies for anon/authenticated — service role bypasses RLS.)