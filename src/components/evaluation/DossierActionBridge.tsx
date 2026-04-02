import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, ArrowRight, GitCompare } from "lucide-react";
import { Link } from "react-router-dom";
import { ApplyWithWDIWF } from "@/components/applications/ApplyWithWDIWF";

interface Props {
  companyId: string;
  companyName: string;
  companySlug: string;
  alignmentScore: number;
  civicScore?: number;
  hasLayoffs?: boolean;
  hasEEOC?: boolean;
  hasPoliticalSpending?: boolean;
}

/**
 * Bridge panel connecting company evaluation to next actions:
 * open roles, apply, compare.
 */
export function DossierActionBridge({ companyId, companyName, companySlug, alignmentScore }: Props) {
  return (
    <div className="mt-8 mb-6">
      <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
        What's next
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Open roles */}
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Open roles</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              See what {companyName} is hiring for right now.
            </p>
            <Link to={`/jobs?company=${encodeURIComponent(companyName)}`}>
              <Button size="sm" variant="outline" className="text-xs h-7 w-full mt-1 gap-1">
                View roles <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Apply */}
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Apply with intelligence</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start a tracked application with employer context attached.
            </p>
            <div className="mt-1">
              <ApplyWithWDIWF
                companyId={companyId}
                companyName={companyName}
                alignmentScore={alignmentScore}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compare */}
        <Card className="hover:border-primary/30 transition-colors">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Compare</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              How does {companyName} stack up against another employer?
            </p>
            <Link to={`/compare?a=${companySlug}`}>
              <Button size="sm" variant="outline" className="text-xs h-7 w-full mt-1 gap-1">
                Compare <GitCompare className="w-3 h-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
