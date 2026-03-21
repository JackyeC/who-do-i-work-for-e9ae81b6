import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { Loader2 } from "lucide-react";
import { useClerkWithFallback } from "@/hooks/use-clerk-fallback";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkWithFallback();
  const { user, loading } = useAuth();
  const { isAdmin, isOwner, isLoading } = useUserRole();

  if (!isLoaded) return null;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Return a generic 404 — don't reveal the page exists to unauthorized users
  if (!user || (!isAdmin && !isOwner)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return <>{children}</>;
}
