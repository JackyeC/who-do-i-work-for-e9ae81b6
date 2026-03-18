import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WhatToAskProps {
  jobTitle: string;
  companyName: string;
  hasSalary: boolean;
  civicScore: number;
  mismatches: string[];
}

export function WhatToAsk({ jobTitle, companyName, hasSalary, civicScore, mismatches }: WhatToAskProps) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["job-questions", jobTitle, companyName],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("job-questions", {
        body: { jobTitle, companyName, hasSalary, civicScore, mismatches },
      });
      if (error) throw error;
      return (data?.questions || []) as string[];
    },
    enabled: !!user && revealed,
    staleTime: 10 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="p-4 rounded-lg border border-border/50 bg-muted/20 relative overflow-hidden">
        <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <MessageCircleQuestion className="w-3 h-3 text-muted-foreground" /> What to Ask in the Interview
        </p>
        <div className="blur-sm select-none pointer-events-none space-y-2">
          <p className="text-sm text-muted-foreground">• How does leadership approach compensation transparency?</p>
          <p className="text-sm text-muted-foreground">• What does retention look like on this team?</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Badge variant="outline" className="gap-1 text-xs">
            <Lock className="w-3 h-3" /> Sign in to unlock
          </Badge>
        </div>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
        <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <MessageCircleQuestion className="w-3 h-3 text-muted-foreground" /> What to Ask in the Interview
        </p>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setRevealed(true)}>
          <MessageCircleQuestion className="w-3.5 h-3.5" /> Generate tailored questions
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
      <p className="text-[10px] font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <MessageCircleQuestion className="w-3 h-3 text-muted-foreground" /> What to Ask in the Interview
      </p>
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating questions based on company signals…
        </div>
      ) : questions && questions.length > 0 ? (
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary font-semibold text-xs mt-0.5">{i + 1}.</span> {q}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic">Unable to generate questions right now.</p>
      )}
    </div>
  );
}
