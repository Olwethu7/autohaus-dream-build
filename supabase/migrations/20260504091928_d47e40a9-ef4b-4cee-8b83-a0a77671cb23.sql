-- Allow users to view their own test drives by matching their email
CREATE POLICY "Users view own test drives"
ON public.test_drives
FOR SELECT
TO authenticated
USING (email = (SELECT auth.jwt() ->> 'email'));

-- Allow users to view their own enquiries by matching their email
CREATE POLICY "Users view own enquiries"
ON public.enquiries
FOR SELECT
TO authenticated
USING (email = (SELECT auth.jwt() ->> 'email'));