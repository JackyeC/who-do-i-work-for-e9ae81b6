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
    label: "Was the compensation structure addressed directly?",
    signalCategory: "compensation_transparency",
    description: "They deferred specifics, offered broad ranges, or indicated it would be discussed later in the process.",
  },
  {
    id: "retention",
    label: "Were retention or departure patterns discussed openly?",
    signalCategory: "workforce_stability",
    description: "Questions about turnover, team changes, or recent departures were met with generalities or redirected.",
  },
  {
    id: "leadership",
    label: "Was leadership stability addressed when asked?",
    signalCategory: "company_behavior",
    description: "Questions about executive changes or organizational restructuring were sidestepped or reframed.",
  },
  {
    id: "growth",
    label: "Were team growth plans described with specifics?",
    signalCategory: "hiring_activity",
    description: "Hiring plans, backfill vs. new headcount, or team size direction were left vague.",
  },
  {
    id: "culture",
    label: "Was culture described with concrete examples?",
    signalCategory: "public_sentiment",
    description: "Phrases like 'we are a family' or 'fast-paced environment' were used without specific supporting detail.",
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
      toast({ title: "Signal recorded", description: "Your observations strengthen the pattern data for future candidates." });
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
            Your observations are now part of the pattern data for {companyName}. This helps future candidates see trajectory, not just episodes.
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
            Process Signal Check
          </CardTitle>
          {flinchCount > 0 && (
            <Badge variant="warning" className="font-mono text-xs">
              {flinchCount} pattern{flinchCount !== 1 ? "s" : ""} noted
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          These are process-level observations. None of them are conclusions on their own. When they repeat across candidates, they tend to reflect something structural. Your input builds the pattern.
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
