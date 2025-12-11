import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const recordSchema = z.object({
  record_type: z.string().min(1, "Record type is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

interface MedicalRecordFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MedicalRecordForm({ patientId, onSuccess, onCancel }: MedicalRecordFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    record_type: "",
    title: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = recordSchema.safeParse(formData);
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
      const { data, error } = await supabase
        .from("medical_records")
        .insert({
          patient_id: patientId,
          record_type: formData.record_type,
          title: formData.title,
          description: formData.description || null,
          recorded_by: user?.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      await logAction("create", "medical_record", data.id, {
        patient_id: patientId,
        record_type: formData.record_type,
        title: formData.title,
      });

      toast({
        title: "Record added",
        description: "Medical record has been successfully added.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding record:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add medical record.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="record_type">Record Type *</Label>
          <Select
            value={formData.record_type}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, record_type: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diagnosis">Diagnosis</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="medication">Medication</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
          {errors.record_type && (
            <p className="text-sm text-destructive">{errors.record_type}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Annual checkup results"
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter detailed information about this record..."
          rows={4}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Record"
          )}
        </Button>
      </div>
    </form>
  );
}
