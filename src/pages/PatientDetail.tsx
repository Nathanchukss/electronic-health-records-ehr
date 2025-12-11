import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import AppLayout from "@/components/layout/AppLayout";
import MedicalRecordForm from "@/components/patients/MedicalRecordForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Plus,
  FileText,
  Pill,
  Stethoscope,
  ClipboardList,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
}

interface ProfileInfo {
  id: string;
  full_name: string;
}

interface MedicalRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  recorded_at: string;
  recorded_by: string | null;
  profiles: ProfileInfo | null;
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  async function fetchPatientData() {
    try {
      const patientResult = await supabase.from("patients").select("*").eq("id", id).single();
      if (patientResult.error) throw patientResult.error;
      
      const recordsResult = await supabase
        .from("medical_records")
        .select("id, record_type, title, description, recorded_at, recorded_by")
        .eq("patient_id", id)
        .order("recorded_at", { ascending: false });
      
      const recorderIds = [...new Set(recordsResult.data?.map((r) => r.recorded_by).filter(Boolean) || [])] as string[];
      let profilesMap = new Map<string, ProfileInfo>();
      
      if (recorderIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", recorderIds);
        
        if (profilesData) {
          profilesMap = new Map(profilesData.map((p) => [p.id, p as ProfileInfo]));
        }
      }
      
      const recordsWithProfiles: MedicalRecord[] = (recordsResult.data || []).map((r) => ({
        id: r.id,
        record_type: r.record_type,
        title: r.title,
        description: r.description,
        recorded_at: r.recorded_at,
        recorded_by: r.recorded_by,
        profiles: r.recorded_by ? profilesMap.get(r.recorded_by) || null : null,
      }));
      
      setPatient(patientResult.data);
      setRecords(recordsWithProfiles);

      await logAction("view", "patient", id, {
        patient_name: `${patientResult.data.first_name} ${patientResult.data.last_name}`,
      });
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load patient data.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePatient() {
    if (!patient) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("patients").delete().eq("id", patient.id);
      if (error) throw error;

      await logAction("delete", "patient", patient.id, {
        patient_name: `${patient.first_name} ${patient.last_name}`,
      });

      toast({
        title: "Patient deleted",
        description: "The patient record has been permanently deleted.",
      });
      navigate("/patients");
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete patient.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleRecordAdded() {
    setShowRecordForm(false);
    fetchPatientData();
  }

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

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "diagnosis":
        return <Stethoscope className="h-4 w-4" />;
      case "medication":
        return <Pill className="h-4 w-4" />;
      case "treatment":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Patient not found</p>
          <Button variant="link" onClick={() => navigate("/patients")}>
            Back to patients
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-muted-foreground">
                {calculateAge(patient.date_of_birth)} years old • {patient.gender}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowRecordForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {patient.first_name} {patient.last_name}? This action cannot be undone and will remove all associated medical records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeletePatient}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patient Information */}
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {format(new Date(patient.date_of_birth), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}
                {(patient.address || patient.city) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[patient.address, patient.city, patient.state, patient.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.emergency_contact_name && (
                    <p className="font-medium">{patient.emergency_contact_name}</p>
                  )}
                  {patient.emergency_contact_relationship && (
                    <Badge variant="secondary">{patient.emergency_contact_relationship}</Badge>
                  )}
                  {patient.emergency_contact_phone && (
                    <p className="text-muted-foreground">{patient.emergency_contact_phone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Medical Records */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Records</CardTitle>
                <CardDescription>
                  {records.length} record{records.length !== 1 ? "s" : ""} on file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showRecordForm ? (
                  <MedicalRecordForm
                    patientId={patient.id}
                    onSuccess={handleRecordAdded}
                    onCancel={() => setShowRecordForm(false)}
                  />
                ) : records.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No medical records yet</p>
                    <Button
                      variant="link"
                      onClick={() => setShowRecordForm(true)}
                      className="mt-2"
                    >
                      Add the first record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                              {getRecordIcon(record.record_type)}
                            </div>
                            <div>
                              <p className="font-medium">{record.title}</p>
                              <Badge variant="outline" className="mt-1 capitalize">
                                {record.record_type}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>{format(new Date(record.recorded_at), "MMM d, yyyy")}</p>
                            {record.profiles?.full_name && (
                              <p>by {record.profiles.full_name}</p>
                            )}
                          </div>
                        </div>
                        {record.description && (
                          <>
                            <Separator className="my-3" />
                            <p className="text-sm text-muted-foreground">{record.description}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
