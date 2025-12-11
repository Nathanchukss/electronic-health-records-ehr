import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientForm from "./pages/PatientForm";
import PatientDetail from "./pages/PatientDetail";
import AuditLogs from "./pages/AuditLogs";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
