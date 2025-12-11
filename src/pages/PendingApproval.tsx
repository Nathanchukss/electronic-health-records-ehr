import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";

export default function PendingApproval() {
  const { user, isStaff, signOut, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created successfully. An administrator needs to assign your staff role before you can access the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please contact your system administrator to complete your account setup.
          </p>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
