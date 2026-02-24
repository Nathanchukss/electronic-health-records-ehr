import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, X, Users } from "lucide-react";

interface Assignment {
  id: string;
  staff_id: string;
  assigned_at: string;
  notes: string | null;
  profile: { full_name: string; email: string } | null;
  roles: string[];
}

interface StaffOption {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
}

interface Props {
  patientId: string;
}

export default function PatientAssignments({ patientId }: Props) {
  const { isAdmin, isDoctor, user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canManage = isAdmin || isDoctor;

  useEffect(() => {
    fetchAssignments();
    if (canManage) fetchAvailableStaff();
  }, [patientId, canManage]);

  async function fetchAssignments() {
    try {
      const { data, error } = await supabase
        .from("patient_assignments")
        .select("id, staff_id, assigned_at, notes")
        .eq("patient_id", patientId);

      if (error) throw error;

      const staffIds = [...new Set((data || []).map((a) => a.staff_id))];
      let profilesMap = new Map<string, { full_name: string; email: string }>();
      let rolesMap = new Map<string, string[]>();

      if (staffIds.length > 0) {
        const [profilesRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email").in("id", staffIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", staffIds),
        ]);

        if (profilesRes.data) {
          profilesMap = new Map(profilesRes.data.map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
        }
        if (rolesRes.data) {
          for (const r of rolesRes.data) {
            const existing = rolesMap.get(r.user_id) || [];
            existing.push(r.role);
            rolesMap.set(r.user_id, existing);
          }
        }
      }

      setAssignments(
        (data || []).map((a) => ({
          ...a,
          profile: profilesMap.get(a.staff_id) || null,
          roles: rolesMap.get(a.staff_id) || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAvailableStaff() {
    try {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      if (!roles || roles.length === 0) return;

      const staffIds = [...new Set(roles.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", staffIds);

      if (profiles) {
        const rolesMap = new Map<string, string[]>();
        for (const r of roles) {
          const existing = rolesMap.get(r.user_id) || [];
          existing.push(r.role);
          rolesMap.set(r.user_id, existing);
        }

        setAvailableStaff(
          profiles.map((p) => ({
            ...p,
            roles: rolesMap.get(p.id) || [],
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  }

  async function handleAssign() {
    if (!selectedStaffId) return;
    setIsAdding(true);

    try {
      const { error } = await supabase.from("patient_assignments").insert({
        patient_id: patientId,
        staff_id: selectedStaffId,
        assigned_by: user?.id,
      });

      if (error) throw error;

      await logAction("create", "patient_assignment", patientId, {
        staff_id: selectedStaffId,
      });

      toast({ title: "Staff assigned", description: "Staff member has been assigned to this patient." });
      setSelectedStaffId("");
      fetchAssignments();
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to assign staff member." });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(assignmentId: string) {
    setRemovingId(assignmentId);
    try {
      const { error } = await supabase.from("patient_assignments").delete().eq("id", assignmentId);
      if (error) throw error;

      await logAction("delete", "patient_assignment", patientId, { assignment_id: assignmentId });

      toast({ title: "Assignment removed", description: "Staff member has been unassigned." });
      fetchAssignments();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove assignment." });
    } finally {
      setRemovingId(null);
    }
  }

  const assignedStaffIds = new Set(assignments.map((a) => a.staff_id));
  const unassignedStaff = availableStaff.filter((s) => !assignedStaffIds.has(s.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4" />
          Assigned Staff
        </CardTitle>
        <CardDescription>
          {assignments.length} staff member{assignments.length !== 1 ? "s" : ""} assigned
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No staff assigned to this patient
              </p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {a.profile?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {a.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs capitalize">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(a.id)}
                        disabled={removingId === a.id}
                        className="h-8 w-8"
                      >
                        {removingId === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canManage && unassignedStaff.length > 0 && (
              <div className="flex gap-2 pt-2">
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} ({s.roles.join(", ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedStaffId || isAdding}
                  size="icon"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
