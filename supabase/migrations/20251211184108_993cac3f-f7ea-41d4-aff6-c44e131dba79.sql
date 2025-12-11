-- Add permissive policy that requires authentication for SELECT on profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()) OR id = auth.uid());

-- Drop the old restrictive policies for SELECT
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;