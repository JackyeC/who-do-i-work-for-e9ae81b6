import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "jackyeclayton@gmail.com";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isOwner, isLoading } = useUserRole();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const emailMatch = user?.email === ADMIN_EMAIL;
  const hasRole = isAdmin || isOwner;

  // Return a generic 404 — don't reveal the page exists to unauthorized users
  if (!user || !hasRole || !emailMatch) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return <>{children}</>;
}
