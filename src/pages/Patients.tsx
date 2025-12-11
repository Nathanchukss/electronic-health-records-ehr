import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Loader2, User } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth, gender, phone, email, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      logAction("view", "patient", undefined, { action: "list_all" });
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchQuery)
    );
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
            <p className="text-muted-foreground">
              Manage and view patient records
            </p>
          </div>
          <Link to="/patients/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Patient Registry</CardTitle>
                <CardDescription>
                  {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-12 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchQuery ? "No patients found matching your search" : "No patients registered yet"}
                </p>
                {!searchQuery && (
                  <Link to="/patients/new">
                    <Button variant="link" className="mt-2">
                      Add your first patient
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell">Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link
                            to={`/patients/${patient.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {patient.first_name} {patient.last_name}
                          </Link>
                        </TableCell>
                        <TableCell>{calculateAge(patient.date_of_birth)} yrs</TableCell>
                        <TableCell className="capitalize">{patient.gender}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {patient.phone || patient.email || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {format(new Date(patient.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
