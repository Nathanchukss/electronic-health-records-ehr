
-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Staff can view assigned patients" ON public.patients;

-- Create new policy requiring medical role + assignment
CREATE POLICY "Medical staff can view assigned patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::staff_role)
  OR (
    (has_role(auth.uid(), 'doctor'::staff_role) OR has_role(auth.uid(), 'nurse'::staff_role))
    AND is_assigned_to_patient(auth.uid(), id)
  )
);
