import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Activity, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalPatients: number;
  totalRecords: number;
  recentPatients: Array<{
    id: string;
    first_name: string;
    last_name: string;
    created_at: string;
  }>;
}

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalRecords: 0,
    recentPatients: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [patientsResult, recordsResult, recentResult] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true }),
          supabase.from("medical_records").select("id", { count: "exact", head: true }),
          supabase
            .from("patients")
            .select("id, first_name, last_name, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setStats({
          totalPatients: patientsResult.count || 0,
          totalRecords: recordsResult.count || 0,
          recentPatients: recentResult.data || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {profile?.full_name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your patient management system.
            </p>
          </div>
          <Link to="/patients/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "—" : stats.totalPatients}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "—" : stats.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                Total documented records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Active</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Latest patients added to the system</CardDescription>
            </div>
            <Link to="/patients">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : stats.recentPatients.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No patients yet</p>
                <Link to="/patients/new">
                  <Button variant="link" className="mt-2">
                    Add your first patient
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Added {format(new Date(patient.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/patients/new" className="block">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-5 w-5 text-primary" />
                  Register New Patient
                </CardTitle>
                <CardDescription>Add a new patient to the system</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/patients" className="block">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  View All Patients
                </CardTitle>
                <CardDescription>Browse and search patient records</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {isAdmin && (
            <Link to="/audit-logs" className="block">
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-primary" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>Review system activity logs</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
