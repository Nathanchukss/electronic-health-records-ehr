
-- Fix 1: Restrict medical records SELECT to assigned patients only
DROP POLICY IF EXISTS "Staff can view medical records" ON public.medical_records;

CREATE POLICY "Medical staff can view assigned patient records"
ON public.medical_records
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::staff_role)
  OR (
    (has_role(auth.uid(), 'doctor'::staff_role) OR has_role(auth.uid(), 'nurse'::staff_role))
    AND is_assigned_to_patient(auth.uid(), patient_id)
  )
);

-- Fix 2: Also restrict medical records UPDATE to assigned patients
DROP POLICY IF EXISTS "Doctors can update medical records" ON public.medical_records;

CREATE POLICY "Doctors can update assigned patient records"
ON public.medical_records
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::staff_role)
  OR (
    has_role(auth.uid(), 'doctor'::staff_role)
    AND is_assigned_to_patient(auth.uid(), patient_id)
  )
);

-- Fix 3: Restrict medical records INSERT to assigned patients
DROP POLICY IF EXISTS "Doctors and nurses can create medical records" ON public.medical_records;

CREATE POLICY "Staff can create records for assigned patients"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::staff_role)
  OR (
    is_staff(auth.uid())
    AND is_assigned_to_patient(auth.uid(), patient_id)
  )
);

-- Fix 4: Auto-assign creating staff to patient via trigger
CREATE OR REPLACE FUNCTION public.auto_assign_patient_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only auto-assign if the creator is a doctor or nurse
  IF is_staff(NEW.created_by) THEN
    INSERT INTO public.patient_assignments (patient_id, staff_id, assigned_by, notes)
    VALUES (NEW.id, NEW.created_by, NEW.created_by, 'Auto-assigned on patient creation')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_assign_on_patient_create
AFTER INSERT ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_patient_creator();
