
-- Create patient_assignments table to track treatment relationships
CREATE TABLE public.patient_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  notes TEXT,
  UNIQUE(patient_id, staff_id)
);

-- Enable RLS
ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for patient_assignments
CREATE POLICY "Admins can manage all assignments"
ON public.patient_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::staff_role));

CREATE POLICY "Staff can view their own assignments"
ON public.patient_assignments
FOR SELECT
USING (staff_id = auth.uid());

CREATE POLICY "Doctors can create assignments"
ON public.patient_assignments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::staff_role) OR has_role(auth.uid(), 'admin'::staff_role));

-- Create function to check if staff is assigned to patient
CREATE OR REPLACE FUNCTION public.is_assigned_to_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.patient_assignments
    WHERE staff_id = _user_id
      AND patient_id = _patient_id
  )
$$;

-- Drop the old permissive policy
DROP POLICY IF EXISTS "Authenticated staff can view patients" ON public.patients;

-- Create new restrictive policy: staff can only view assigned patients, admins can view all
CREATE POLICY "Staff can view assigned patients"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::staff_role) 
  OR is_assigned_to_patient(auth.uid(), id)
);

-- Update the update policy to also require assignment
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;

CREATE POLICY "Staff can update assigned patients"
ON public.patients
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::staff_role)
  OR (is_staff(auth.uid()) AND is_assigned_to_patient(auth.uid(), id))
);
