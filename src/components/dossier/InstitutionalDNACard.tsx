import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Landmark, ExternalLink, Scale, Info, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

interface Signal {
  id: string;
  person_name: string;
  person_title: string | null;
  institution_name: string;
  institution_category: "traditional_policy" | "progress_policy" | "bipartisan";
  link_type: string;
  link_description: string;
  evidence_url: string | null;
  evidence_source: string | null;
  confidence: string;
}

const CATEGORY_META = {
  traditional_policy: {
    label: "Traditional Family Policy Networks",
    tag: "Heritage / Project 2025",
    color: "text-destructive",
    bg: "bg-destructive/5 border-destructive/15",
    icon: Landmark,
  },
  progress_policy: {
    label: "Progress-Oriented Policy Networks",
    tag: "CAP / Progressive",
    color: "text-[hsl(var(--civic-blue))]",
    bg: "bg-[hsl(var(--civic-blue))]/5 border-[hsl(var(--civic-blue))]/15",
    icon: Scale,
  },
  bipartisan: {
    label: "Bipartisan Institutional Networks",
    tag: "Bipartisan",
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-border/30",
    icon: Building2,
  },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20",
  medium: "bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20",
  low: "bg-muted text-muted-foreground border-border/40",
};

const LINK_TYPE_LABELS: Record<string, string> = {
  board_seat: "Board Seat",
  advisory_role: "Advisory Role",
  donation: "Donation",
  endorsement: "Endorsement",
  speaking: "Speaking Engagement",
  membership: "Membership",
  pac_contribution: "PAC Contribution",
  corporate_funding: "Corporate Funding",
  published_support: "Published Support",
  documented_link: "Documented Link",
};

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/20">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium text-foreground">{signal.person_name}</span>
          {signal.person_title && (
            <span className="text-[10px] text-muted-foreground">· {signal.person_title}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{signal.link_description}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {LINK_TYPE_LABELS[signal.link_type] || signal.link_type}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", CONFIDENCE_STYLES[signal.confidence])}>
            {signal.confidence}
          </Badge>
          {signal.evidence_url && (
            <a
              href={signal.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              {signal.evidence_source || "Source"} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorySection({ category, signals }: { category: keyof typeof CATEGORY_META; signals: Signal[] }) {
  if (signals.length === 0) return null;
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", meta.bg)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", meta.color)} />
        <h4 className="text-sm font-semibold text-foreground">Documented Link to {meta.label}</h4>
        <Badge variant="outline" className={cn("text-[10px] ml-auto", meta.color)}>
          {signals.length} link{signals.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="space-y-2">
        {signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}

export function InstitutionalDNACard({ companyId, companyName }: Props) {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["institutional-dna", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("institutional_alignment_signals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Signal[];
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const traditional = (signals || []).filter((s) => s.institution_category === "traditional_policy");
  const progress = (signals || []).filter((s) => s.institution_category === "progress_policy");
  const bipartisan = (signals || []).filter((s) => s.institution_category === "bipartisan");
  const isBipartisanFunder = traditional.length > 0 && progress.length > 0;

  if (!signals || signals.length === 0) {
    return (
      <Card className="border-dashed border-border/40">
        <CardContent className="p-6 text-center">
          <Building2 className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No institutional policy network connections detected yet for {companyName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Policy & Institutional Networks
          {isBipartisanFunder && (
            <Badge variant="outline" className="ml-auto text-[10px] bg-primary/5 text-primary border-primary/20">
              <Scale className="w-3 h-3 mr-1" />
              Bipartisan Institutional Funder
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CIO Context */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            This intelligence identifies the institutional networks this company influences through funding
            or leadership. These networks represent different blueprints for the future of the American
            workforce and family structure.
          </p>
        </div>

        <CategorySection category="traditional_policy" signals={traditional} />
        <CategorySection category="progress_policy" signals={progress} />
        <CategorySection category="bipartisan" signals={bipartisan} />

        {/* Mandatory context note */}
        <div className="flex items-start gap-2 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Institutional alignment indicates which policy blueprints a company or its leadership supports
            through funding or board membership. WDIWF provides these receipts so you can align your career
            with the future you believe in. Sources: FEC filings · OpenSecrets · Organization leadership
            directories · Public board disclosures · SEC filings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
