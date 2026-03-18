import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Send } from "lucide-react";

interface FlinchQuestion {
  id: string;
  label: string;
  signalCategory: string;
  description: string;
}

const FLINCH_QUESTIONS: FlinchQuestion[] = [
  {
    id: "comp",
    label: "Did they dodge the compensation structure question?",
    signalCategory: "compensation_transparency",
    description: "Deflected, gave vague ranges, or said 'we'll discuss that later'",
  },
  {
    id: "retention",
    label: "Did they get vague about retention or layoffs?",
    signalCategory: "workforce_stability",
    description: "Avoided specifics on turnover, reorgs, or recent departures",
  },
  {
    id: "leadership",
    label: "Did they redirect when asked about leadership stability?",
    signalCategory: "company_behavior",
    description: "Sidestepped questions about executive changes or org restructuring",
  },
  {
    id: "growth",
    label: "Did they avoid specifics on team growth?",
    signalCategory: "hiring_activity",
    description: "Couldn't articulate hiring plans, backfill vs. new headcount, or team size trajectory",
  },
  {
    id: "culture",
    label: "Did they use buzzwords without evidence when asked about culture?",
    signalCategory: "public_sentiment",
    description: "Said 'we're like a family' or 'fast-paced' without concrete examples",
  },
];

interface FlinchTestProps {
  companyId: string;
  companyName: string;
}

export function FlinchTest({ companyId, companyName }: FlinchTestProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleResponse = (id: string) => {
    setResponses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flinchCount = Object.values(responses).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const rows = FLINCH_QUESTIONS.map((q) => ({
        user_id: user.id,
        company_id: companyId,
        company_name: companyName,
        signal_category: q.signalCategory,
        flinch_detected: !!responses[q.id],
      }));

      const { error } = await supabase
        .from("interview_flinch_signals" as any)
        .insert(rows as any);

      if (error) throw error;

      setSubmitted(true);
      toast({ title: "Flinch data recorded", description: "Your signals help other candidates make informed decisions." });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-civic-green/30 bg-civic-green/5">
        <CardContent className="p-6 text-center">
          <Eye className="w-8 h-8 text-civic-green mx-auto mb-3" />
          <p className="font-mono text-sm font-semibold text-civic-green uppercase tracking-wider">Signal Recorded</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your anonymized feedback strengthens the intelligence for future candidates evaluating {companyName}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-civic-yellow" />
          <CardTitle className="font-mono text-sm uppercase tracking-wider">
            The Flinch Test
          </CardTitle>
          {flinchCount > 0 && (
            <Badge variant="warning" className="font-mono text-[10px]">
              {flinchCount} flinch{flinchCount !== 1 ? "es" : ""} detected
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Did the interviewer hesitate, deflect, or dodge when you asked our tactical questions? Flag it below — your anonymized signals help other candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {FLINCH_QUESTIONS.map((q) => (
          <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <Switch
              checked={!!responses[q.id]}
              onCheckedChange={() => toggleResponse(q.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label className="text-sm font-medium cursor-pointer" onClick={() => toggleResponse(q.id)}>
                {q.label}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">{q.description}</p>
            </div>
          </div>
        ))}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full gap-2 font-mono text-xs uppercase tracking-wider"
          variant="outline"
        >
          <Send className="w-3.5 h-3.5" />
          {submitting ? "Submitting…" : "Submit Flinch Signals"}
        </Button>
      </CardContent>
    </Card>
  );
}
