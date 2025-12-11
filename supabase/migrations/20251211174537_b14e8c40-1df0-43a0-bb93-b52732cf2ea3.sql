-- Create role enum for staff roles
CREATE TYPE public.staff_role AS ENUM ('admin', 'doctor', 'nurse');

-- Create profiles table for staff information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role staff_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create patients table for demographics
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- diagnosis, treatment, medication, note
  title TEXT NOT NULL,
  description TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_logs table for tracking all actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- view, create, update, delete
  resource_type TEXT NOT NULL, -- patient, medical_record
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role staff_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for patients (only staff can access)
CREATE POLICY "Staff can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can delete patients"
  ON public.patients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for medical_records (only staff can access)
CREATE POLICY "Staff can view medical records"
  ON public.medical_records FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Doctors and nurses can create medical records"
  ON public.medical_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Doctors can update medical records"
  ON public.medical_records FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete medical records"
  ON public.medical_records FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _details)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;