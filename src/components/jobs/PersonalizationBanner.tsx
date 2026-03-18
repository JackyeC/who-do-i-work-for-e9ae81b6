import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings, ChevronRight, UserCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WorkProfile {
  priorities?: string[];
  avoidances?: string[];
  sliders?: Record<string, number>;
}

function getWorkProfile(): WorkProfile | null {
  try {
    const raw = localStorage.getItem("userWorkProfile");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const PRIORITY_LABELS: Record<string, string> = {
  values: "Values Alignment",
  stability: "Job Stability",
  sustainability: "Sustainability",
  equity: "Pay Equity",
  flexibility: "Flexibility",
  growth: "Career Growth",
};

export function PersonalizationBanner() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WorkProfile | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setProfile(getWorkProfile());
  }, []);

  if (dismissed) return null;

  // No profile set — prompt to create one
  if (!profile || !profile.priorities?.length) {
    return (
      <Card className="border-primary/20 bg-primary/[0.03] backdrop-blur-sm mb-6">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Personalize your job feed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set your work priorities and values — we'll silently rank jobs that match what matters to you.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Button size="sm" asChild className="gap-1.5">
                <Link to="/career-dashboard">
                  Set Preferences <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild className="gap-1.5">
                <Link to="/login">
                  Sign In to Personalize <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDismissed(true)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Profile exists — show what's active
  const activePriorities = profile.priorities?.slice(0, 4) || [];

  return (
    <Card className="border-primary/15 bg-primary/[0.02] backdrop-blur-sm mb-6">
      <CardContent className="p-3 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">Sorted for you</span>
          <span className="text-xs text-muted-foreground">·</span>
          {activePriorities.map((p) => (
            <Badge key={p} variant="outline" className="text-[10px] py-0 bg-primary/5 border-primary/15 text-primary">
              {PRIORITY_LABELS[p] || p}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant="ghost" asChild className="gap-1 text-xs h-7 shrink-0">
          <Link to="/career-dashboard">
            <Settings className="w-3 h-3" /> Edit
          </Link>
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setDismissed(true)}>
          <X className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
