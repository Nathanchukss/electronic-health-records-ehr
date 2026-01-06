-- Remove the permissive INSERT policy that allows any staff to insert audit logs
-- The log_audit_event function (SECURITY DEFINER) will handle all audit log inserts
DROP POLICY IF EXISTS "Staff can insert audit logs" ON public.audit_logs;