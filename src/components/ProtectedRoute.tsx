import { SignedIn, SignedOut, RedirectToSignIn, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCareerWaitlist } from "@/hooks/use-career-waitlist";
import { useUserRole } from "@/hooks/use-user-role";
import { CareerWaitlistGate } from "@/components/career/CareerWaitlistGate";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkAuth();

  if (!isLoaded) return null;

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <ProtectedRouteInner>{children}</ProtectedRouteInner>
      </SignedIn>
    </>
  );
}

function ProtectedRouteInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isApproved, isLoading: waitlistLoading } = useCareerWaitlist();
  const { isAdmin, isOwner, isLoading: roleLoading } = useUserRole();

  if (loading || roleLoading || waitlistLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If Supabase user isn't loaded yet (Clerk is signed in but Supabase bridge pending), show content
  if (!user) {
    return <>{children}</>;
  }

  if (!isAdmin && !isOwner && !isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-6 flex-1">
          <CareerWaitlistGate />
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}
