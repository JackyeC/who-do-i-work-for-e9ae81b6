import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Landmark, Network, ExternalLink, ShieldCheck, Clock, Loader2 } from "lucide-react";

interface TransparencyResearchTabProps {
  companyId: string;
  companyName: string;
}

function ResearchSection({ icon: Icon, title, content }: { icon: any; title: string; content: string }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}

export function TransparencyResearchTab({ companyId, companyName }: TransparencyResearchTabProps) {
  const { data: research, isLoading } = useQuery({
    queryKey: ["company-research-approved", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_research")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!research) {
    return (
      <Card className="border-dashed border-border/40">
        <CardContent className="p-8 text-center">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No Vetted Research Yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Transparency research for {companyName} is pending expert review.
            Check back soon — our team is working on it.
          </p>
        </CardContent>
      </Card>
    );
  }

  const citations = Array.isArray(research.citations) ? research.citations : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
         <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 gap-1">
          <ShieldCheck className="w-3 h-3" /> Vetted by Jackye Clayton
        </Badge>
        {research.approved_at && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(research.approved_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {research.research_summary && (
        <ResearchSection icon={Building2} title="Company Overview" content={research.research_summary} />
      )}
      {research.leadership_notes && (
        <ResearchSection icon={Users} title="Leadership & Board" content={research.leadership_notes} />
      )}
      {research.political_spending_notes && (
        <ResearchSection icon={Landmark} title="Political Spending & Activity" content={research.political_spending_notes} />
      )}
      {research.connection_chain && (
        <ResearchSection icon={Network} title="Connection Chain & Red Flags" content={research.connection_chain} />
      )}

      {citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {citations.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
              Source [{i + 1}] <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
