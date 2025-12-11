import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog, Shield, Stethoscope, HeartPulse } from "lucide-react";
import { format } from "date-fns";

type StaffRole = "admin" | "doctor" | "nurse";

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  created_at: string;
  roles: StaffRole[];
}

export default function Staff() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  async function fetchStaff() {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const staffWithRoles = profiles.map((profile) => ({
        ...profile,
        roles: roles
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as StaffRole),
      }));

      setStaff(staffWithRoles);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: StaffRole | "none") {
    if (userId === user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You cannot change your own role.",
      });
      return;
    }

    setUpdatingUserId(userId);

    try {
      // First, remove all existing roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // If a role is selected (not "none"), add the new role
      if (newRole !== "none") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      toast({
        title: "Role updated",
        description: newRole === "none" 
          ? "User role has been removed." 
          : `User role has been updated to ${newRole}.`,
      });

      fetchStaff();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "doctor":
        return <Stethoscope className="h-3 w-3" />;
      case "nurse":
        return <HeartPulse className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: StaffRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "doctor":
        return "secondary";
      case "nurse":
        return "outline";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff accounts and assign roles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Staff Members
            </CardTitle>
            <CardDescription>
              {staff.length} staff member{staff.length !== 1 ? "s" : ""} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : staff.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No staff members registered
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.full_name}
                          {member.id === user?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {member.roles.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              No role
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {member.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={getRoleBadgeVariant(role)}
                                  className="gap-1 capitalize"
                                >
                                  {getRoleIcon(role)}
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.roles[0] || "none"}
                            onValueChange={(value) =>
                              handleRoleChange(member.id, value as StaffRole | "none")
                            }
                            disabled={updatingUserId === member.id || member.id === user?.id}
                          >
                            <SelectTrigger className="w-32">
                              {updatingUserId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No role</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="nurse">Nurse</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions</CardTitle>
            <CardDescription>Understanding staff access levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
              <p className="text-sm text-muted-foreground">
                Full system access. Can manage staff roles, view audit logs, and delete patients.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="gap-1">
                <Stethoscope className="h-3 w-3" />
                Doctor
              </Badge>
              <p className="text-sm text-muted-foreground">
                Can view and manage patients, create and update medical records.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="gap-1">
                <HeartPulse className="h-3 w-3" />
                Nurse
              </Badge>
              <p className="text-sm text-muted-foreground">
                Can view patients and create medical records. Cannot update existing records.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
