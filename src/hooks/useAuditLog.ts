import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

type AuditAction = "view" | "create" | "update" | "delete";
type ResourceType = "patient" | "medical_record";

export function useAuditLog() {
  async function logAction(
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    details?: Record<string, string>
  ) {
    try {
      await supabase.rpc("log_audit_event", {
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _details: (details as Json) || null,
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  }

  return { logAction };
}
