import { Archive, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CompanyLogo } from "@/components/CompanyLogo";
import { InsiderScorePill } from "@/components/InsiderScorePill";
import type { TrackedCompany } from "@/hooks/use-tracked-companies";

interface TrackedCompanyCardProps {
  tracked: TrackedCompany;
  onUntrack: (companyId: string) => void;
  isUntracking: boolean;
}

export function TrackedCompanyCard({ tracked, onUntrack, isUntracking }: TrackedCompanyCardProps) {
  const navigate = useNavigate();
  const company = tracked.company;
  if (!company) return null;

  const score = company.civic_footprint_score;

  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 flex items-center gap-4 hover:border-primary/20 transition-colors group">
      <CompanyLogo companyName={company.name} logoUrl={company.logo_url} size="md" />

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate">{company.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-caption text-muted-foreground">{company.industry}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-caption text-muted-foreground">{company.state}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-center px-3">
          <div className="text-lg font-bold font-mono text-primary">{score}</div>
          <div className="text-micro text-muted-foreground">Influence</div>
        </div>
        <InsiderScorePill score={(company as any).insider_score ?? null} />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/dossier/${company.slug}`)}
          className="gap-1 text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Dossier
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUntrack(company.id)}
          disabled={isUntracking}
          className="gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Archive className="w-3.5 h-3.5" />
          Untrack
        </Button>
      </div>
    </div>
  );
}
