import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Scale, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, FileText, Loader2, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  companyId: string;
  companyName: string;
}

export function CourtRecordsCard({ companyId, companyName }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["court-cases", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_court_cases")
        .select("*")
        .eq("company_id", companyId)
        .order("date_filed", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openCases = cases?.filter((c: any) => c.status === "open") || [];
  const closedCases = cases?.filter((c: any) => c.status === "closed") || [];
  const laborCases = cases?.filter((c: any) =>
    /labor|employment|discrimination|wage|retaliation|title.vii|flsa|ada|eeoc/i.test(
      `${c.nature_of_suit || ""} ${c.cause || ""} ${c.case_name || ""}`
    )
  ) || [];

  const displayCases = expanded ? cases : cases?.slice(0, 5);

  const getRoleBadge = (role: string) => {
    if (role === "defendant") return <Badge variant="destructive" className="text-xs">Defendant</Badge>;
    if (role === "plaintiff") return <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">Plaintiff</Badge>;
    return <Badge variant="outline" className="text-xs">Party</Badge>;
  };

  const getStatusColor = (status: string) =>
    status === "open" ? "text-amber-500" : "text-muted-foreground";

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-8 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Checking court records…</span>
        </CardContent>
      </Card>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Court Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-[hsl(var(--civic-green))]" />
            No federal court cases found in RECAP archive for {companyName}.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Court Records
            <Badge variant="outline" className="font-mono text-xs">{cases.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            {openCases.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">
                {openCases.length} Open
              </Badge>
            )}
            {laborCases.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {laborCases.length} Labor/Employment
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Federal court cases from the RECAP archive (CourtListener). Includes civil, labor, and regulatory actions.
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: "Total Cases", value: cases.length },
            { label: "Open", value: openCases.length },
            { label: "Closed", value: closedCases.length },
            { label: "Labor/Emp.", value: laborCases.length },
          ].map(s => (
            <div key={s.label} className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="font-mono font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Case list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {displayCases?.map((c: any) => (
            <div
              key={c.id}
              className="p-3 rounded-lg bg-muted/20 border border-border/20 hover:border-border/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {c.case_name}
                    </span>
                    {getRoleBadge(c.plaintiff_or_defendant)}
                    <span className={cn("text-xs font-mono", getStatusColor(c.status))}>
                      {c.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {c.case_number && (
                      <span className="font-mono">#{c.case_number}</span>
                    )}
                    {c.court_name && <span>{c.court_name}</span>}
                    {c.date_filed && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.date_filed).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {c.nature_of_suit && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {c.nature_of_suit}
                      </Badge>
                    </div>
                  )}
                </div>

                {c.courtlistener_url && (
                  <a
                    href={c.courtlistener_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {cases.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs"
          >
            {expanded ? (
              <>Show Less <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>Show All {cases.length} Cases <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </Button>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
          <FileText className="h-3 w-3" />
          Source: CourtListener RECAP Archive (PACER mirror) • Public federal court records
        </div>
      </CardContent>
    </Card>
  );
}
