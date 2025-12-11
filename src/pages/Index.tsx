import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users, ClipboardList } from "lucide-react";

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">HealthCare Portal</span>
          </div>
          <Link to="/auth">
            <Button>Staff Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Patient Management System
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Secure, efficient healthcare administration for medical professionals.
            Manage patient records, track medical history, and maintain compliance with audit logging.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Shield className="h-4 w-4" />
                Access Portal
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 text-left">
              <Users className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Patient Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete patient demographics and medical records in one place.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Role-Based Access</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure access control for admins, doctors, and nurses.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <ClipboardList className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">Audit Logging</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete activity tracking for compliance and security.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
