
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL::uuid,
  _details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _log_id UUID;
BEGIN
  -- Validate action
  IF _action NOT IN ('view', 'create', 'update', 'delete') THEN
    RAISE EXCEPTION 'Invalid action type';
  END IF;
  
  -- Validate resource_type
  IF _resource_type NOT IN ('patient', 'medical_record', 'patient_assignment') THEN
    RAISE EXCEPTION 'Invalid resource type';
  END IF;
  
  -- Only allow staff to log events
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (auth.uid(), _action, _resource_type, _resource_id, _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;
