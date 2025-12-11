-- Add permissive policy that requires authentication for SELECT on patients
CREATE POLICY "Authenticated staff can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Staff can view patients" ON public.patients;