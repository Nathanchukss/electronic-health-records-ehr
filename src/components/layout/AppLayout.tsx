import { ReactNode } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Heart,
  LayoutDashboard,
  Users,
  ClipboardList,
  Shield,
  UserCog,
  LogOut,
  Loader2,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, roles, isLoading, isStaff, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/pending-approval" replace />;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patients", label: "Patients", icon: Users },
  ];

  if (isAdmin) {
    navItems.push(
      { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList },
      { href: "/staff", label: "Staff", icon: UserCog }
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (roles.includes("admin")) return "Admin";
    if (roles.includes("doctor")) return "Doctor";
    if (roles.includes("nurse")) return "Nurse";
    return "Staff";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">HealthCare</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={location.pathname === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      location.pathname === item.href && "bg-secondary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 pr-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(profile?.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium">{profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{getRoleBadge()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Shield className="h-4 w-4" />
                Role: {getRoleBadge()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="sticky top-16 z-40 border-b bg-card px-4 py-2 md:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={location.pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className="gap-2 whitespace-nowrap"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
