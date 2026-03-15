import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  Shield, ShieldCheck, ExternalLink, Building2, Sparkles, Network, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface JobIntegrityCardProps {
  job: {
    id: string;
    title: string;
    location: string | null;
    work_mode: string | null;
    url: string | null;
    created_at: string;
    company_id: string;
    companies?: {
      name: string;
      slug: string;
      logo_url: string | null;
      vetted_status: string | null;
      jackye_insight: string | null;
      description: string | null;
    };
  };
}

export function JobIntegrityCard({ job }: JobIntegrityCardProps) {
  const co = job.companies;
  const isCertified = co?.vetted_status === "certified";
  const isVerified = co?.vetted_status === "verified";

  // Fetch connection chain summary (latest approved research)
  const { data: research } = useQuery({
    queryKey: ["job-research-snippet", job.company_id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_research")
        .select("connection_chain, research_summary")
        .eq("company_id", job.company_id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!job.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className={cn(
      "border-border/40 hover:border-primary/20 transition-all group",
      isCertified && "ring-1 ring-amber-500/20 border-amber-500/15"
    )}>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <CompanyLogo companyName={co?.name || "Unknown"} logoUrl={co?.logo_url} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight">{job.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Link to={`/company/${co?.slug}`} className="text-xs text-primary hover:underline">
                {co?.name || "Unknown Company"}
              </Link>
              {isVerified && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </Badge>
              )}
              {isCertified && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <ShieldCheck className="w-2.5 h-2.5" /> Certified
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {job.location || "Remote"} {job.work_mode ? `· ${job.work_mode}` : ""}
            </p>
          </div>
        </div>

        {/* Jackye Insight — read-only, cannot be edited by employers */}
        {co?.jackye_insight && (
          <div className="p-3 bg-primary/[0.04] border border-primary/10 rounded-lg">
            <p className="text-[10px] font-medium text-primary mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Jackye's Insight
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {co.jackye_insight}
            </p>
          </div>
        )}

        {/* Connection Chain snippet — read-only */}
        {research?.connection_chain && (
          <div className="p-3 bg-muted/30 border border-border/40 rounded-lg">
            <p className="text-[10px] font-medium text-foreground mb-1 flex items-center gap-1">
              <Network className="w-3 h-3 text-muted-foreground" /> Connection Chain
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {research.connection_chain}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {job.url ? (
            <Button size="sm" asChild className="gap-1.5 flex-1">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          ) : (
            <Button size="sm" disabled className="gap-1.5 flex-1">
              Apply
            </Button>
          )}
          <Button size="sm" variant="outline" asChild className="gap-1 shrink-0">
            <Link to={`/company/${co?.slug}`}>
              <Eye className="w-3 h-3" /> Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
