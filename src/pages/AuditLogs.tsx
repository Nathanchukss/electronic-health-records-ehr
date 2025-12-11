import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Eye, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: unknown;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

export default function AuditLogs() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  async function fetchLogs() {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      const userIds = [...new Set(logsData.map((l) => l.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
      const data = logsData.map((log) => ({
        ...log,
        profiles: log.user_id ? profilesMap.get(log.user_id) || null : null,
      }));
      
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "view":
        return <Eye className="h-4 w-4" />;
      case "create":
        return <Plus className="h-4 w-4" />;
      case "update":
        return <Pencil className="h-4 w-4" />;
      case "delete":
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "view":
        return "bg-muted text-muted-foreground";
      case "create":
        return "bg-success/10 text-success";
      case "update":
        return "bg-warning/10 text-warning";
      case "delete":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activity and data access
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""} recorded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="medical_record">Medical Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className={`rounded-md p-2 ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {log.profiles?.full_name || "Unknown User"}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {log.action}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {log.resource_type.replace("_", " ")}
                        </Badge>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground">
                          {(log.details as Record<string, string>).patient_name ||
                            (log.details as Record<string, string>).title ||
                            (log.details as Record<string, string>).action ||
                            JSON.stringify(log.details)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
