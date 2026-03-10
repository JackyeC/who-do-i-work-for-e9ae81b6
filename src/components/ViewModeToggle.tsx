import { User, Briefcase, Lock } from "lucide-react";
import { useViewMode } from "@/contexts/ViewModeContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ViewModeToggle() {
  const { viewMode, setViewMode, canAccessRecruiter } = useViewMode();

  return (
    <div className="flex items-center bg-muted/60 rounded-xl p-0.5 border border-border/40">
      <button
        onClick={() => setViewMode("candidate")}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200",
          viewMode === "candidate"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="w-3 h-3" />
        Candidate
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => canAccessRecruiter && setViewMode("recruiter")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200",
              viewMode === "recruiter"
                ? "bg-primary text-primary-foreground shadow-sm"
                : canAccessRecruiter
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {!canAccessRecruiter && <Lock className="w-3 h-3" />}
            <Briefcase className="w-3 h-3" />
            Pro
          </button>
        </TooltipTrigger>
        {!canAccessRecruiter && (
          <TooltipContent side="bottom" className="text-xs">
            Upgrade to Pro to access Recruiter &amp; Sales intelligence
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
