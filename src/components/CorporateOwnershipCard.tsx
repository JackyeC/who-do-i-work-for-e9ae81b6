import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ArrowRight, Network, ExternalLink, Sparkles, GitBranch,
  AlertTriangle, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CorporateOwnershipCardProps {
  companyId: string;
  companyName: string;
  parentCompany?: string | null;
}

interface StructureEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  parent_entity_name: string | null;
  jurisdiction: string | null;
  status: string | null;
  officer_name: string | null;
  officer_role: string | null;
  source_name: string;
  confidence: string;
}

const TYPE_STYLES: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  subsidiary: { label: "Subsidiary", icon: Building2, color: "text-[hsl(var(--civic-blue))]" },
  parent: { label: "Parent Company", icon: Crown, color: "text-[hsl(var(--civic-yellow))]" },
  brand: { label: "Brand", icon: Building2, color: "text-primary" },
  division: { label: "Division", icon: GitBranch, color: "text-muted-foreground" },
  joint_venture: { label: "Joint Venture", icon: Network, color: "text-[hsl(var(--civic-green))]" },
  holding_company: { label: "Holding Company", icon: Crown, color: "text-[hsl(var(--civic-yellow))]" },
};

export function CorporateOwnershipCard({ companyId, companyName, parentCompany }: CorporateOwnershipCardProps) {
  // Get corporate structure entities
  const { data: structures } = useQuery({
    queryKey: ["corporate-structure", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_corporate_structure")
        .select("*")
        .eq("company_id", companyId)
        .order("entity_type", { ascending: true });
      return (data || []) as StructureEntity[];
    },
    enabled: !!companyId,
  });

  // Try to find the parent company in our database for linking
  const { data: parentRecord } = useQuery({
    queryKey: ["parent-company-lookup", parentCompany],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, employer_clarity_score")
        .ilike("name", `%${parentCompany}%`)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!parentCompany,
  });

  // Find sister companies (same parent)
  const { data: sisterCompanies } = useQuery({
    queryKey: ["sister-companies", parentCompany],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, employer_clarity_score")
        .ilike("parent_company", `%${parentCompany}%`)
        .neq("id", companyId)
        .order("name")
        .limit(20);
      return data || [];
    },
    enabled: !!parentCompany,
  });

  const hasParent = !!parentCompany;
  const hasSisters = sisterCompanies && sisterCompanies.length > 0;
  const hasStructures = structures && structures.length > 0;

  // Don't render if no ownership data at all
  if (!hasParent && !hasStructures) return null;

  return (
    <Card className="border-[hsl(var(--civic-yellow))]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Network className="w-5 h-5 text-[hsl(var(--civic-yellow))]" />
          Corporate Family
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Who owns {companyName}, their subsidiaries, and related brands.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Parent Company — prominent */}
        {hasParent && (
          <div className="rounded-lg border border-[hsl(var(--civic-yellow))]/20 bg-[hsl(var(--civic-yellow))]/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-[hsl(var(--civic-yellow))] font-semibold">
                Parent Company
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-foreground">{parentCompany}</h4>
                {parentRecord && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {parentRecord.industry} · Score: {parentRecord.employer_clarity_score}/100
                  </p>
                )}
              </div>
              {parentRecord ? (
                <Link
                  to={`/company/${parentRecord.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-mono text-xs tracking-wider uppercase transition-colors rounded-md"
                >
                  View Report <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Not yet in database
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {companyName} is owned by {parentCompany}. Decisions, lobbying, and political spending may be directed at the parent level.
            </p>
          </div>
        )}

        {/* Sister Companies / Brands */}
        {hasSisters && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary font-semibold">
                Sister Companies & Brands ({sisterCompanies.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sisterCompanies.map((sister: any) => (
                <Link
                  key={sister.id}
                  to={`/company/${sister.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                        {sister.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{sister.industry}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "font-mono text-xs font-bold",
                      sister.employer_clarity_score >= 60 ? "text-[hsl(var(--civic-green))]" :
                      sister.employer_clarity_score >= 30 ? "text-[hsl(var(--civic-yellow))]" :
                      "text-destructive"
                    )}>
                      {sister.employer_clarity_score}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Corporate Structure Entities */}
        {hasStructures && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                Corporate Entities ({structures.length})
              </span>
            </div>
            <div className="space-y-2">
              {structures.map((entity) => {
                const typeInfo = TYPE_STYLES[entity.entity_type] || TYPE_STYLES.subsidiary;
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TypeIcon className={cn("w-4 h-4 shrink-0", typeInfo.color)} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{entity.entity_name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{typeInfo.label}</Badge>
                          {entity.jurisdiction && <span>{entity.jurisdiction}</span>}
                          {entity.status && <span>· {entity.status}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-xs px-1.5">{entity.confidence}</Badge>
                      <Badge variant="outline" className="text-xs px-1.5">{entity.source_name}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Jackye's Take */}
        <div className="bg-primary/[0.03] border border-primary/15 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {hasParent
              ? `${companyName} is part of the ${parentCompany} corporate family. When you're evaluating this employer, look at the parent company too — their lobbying, PAC spending, and political influence may shape your workplace even if ${companyName} looks clean on paper.${hasSisters ? ` There are ${sisterCompanies!.length} other companies under the same umbrella — compare them to see if the parent's values are consistent across brands.` : ''}`
              : `${companyName} appears to operate independently. ${hasStructures ? `They have ${structures!.length} registered entities in their corporate structure — check for offshore entities or unusual holding patterns.` : 'No unusual corporate structure detected.'}`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
