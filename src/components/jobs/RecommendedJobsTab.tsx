import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lock, UserCircle, ChevronRight } from "lucide-react";

export function RecommendedJobsTab() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sign in for personalized matches</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Take the Work DNA quiz and set your job preferences to get AI-ranked matches based on your values, salary needs, and location.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link to="/login">
            Sign In <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <UserCircle className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Personalized matches coming soon</h3>
        <p className="text-sm text-muted-foreground max-w-md mt-1">
          We're building AI-powered job matching based on your Work DNA quiz results, saved preferences, and values alignment scores.
        </p>
      </div>
      <Button variant="outline" asChild className="gap-1.5">
        <Link to="/job-dashboard?tab=preferences">
          Set Preferences <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}
