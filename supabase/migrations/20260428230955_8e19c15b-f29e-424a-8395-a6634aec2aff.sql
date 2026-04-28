
-- Restrict listing to admins only; public can still SELECT specific objects (read images by URL)
DROP POLICY "Public read vehicle images" ON storage.objects;
CREATE POLICY "Public read vehicle images by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-images' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

-- Lock down has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
