import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  emergency_contact_relationship: z.string().max(50).optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  function handleChange(field: keyof PatientFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = patientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from("patients")
        .insert(insertData)
        .select("id")
        .single();

      if (error) throw error;

      await logAction("create", "patient", data.id, {
        patient_name: `${formData.first_name} ${formData.last_name}`,
      });

      toast({
        title: "Patient registered",
        description: `${formData.first_name} ${formData.last_name} has been added to the system.`,
      });

      navigate(`/patients/${data.id}`);
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to register patient. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Register Patient</h1>
            <p className="text-muted-foreground">Add a new patient to the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Patient's personal details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">{errors.date_of_birth}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
              <CardDescription>How to reach the patient</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john.doe@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleChange("zip_code", e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleChange("emergency_contact_relationship", e.target.value)}
                  placeholder="Spouse"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Patient"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
