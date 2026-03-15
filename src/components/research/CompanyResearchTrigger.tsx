import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertTriangle, ExternalLink, Building2, Landmark, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyResearchTriggerProps {
  companyName: string;
  className?: string;
  onPublished?: (companyId: string) => void;
}

interface DraftResult {
  summary: string | null;
  leadership: string | null;
  political: string | null;
  controversies: string | null;
  citations: string[];
}

export function CompanyResearchTrigger({ companyName, className, onPublished }: CompanyResearchTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleResearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-research-perplexity", {
        body: { companyName, requesterNote: note || undefined },
      });

      if (error) throw error;

      if (data.alreadyExists) {
        toast.info("This company has already been submitted for review!");
        setSubmitted(true);
        if (data.summary) setDraft({ summary: data.summary, leadership: null, political: null, controversies: null, citations: [] });
        return;
      }

      setDraft(data.draft);
      setSubmitted(true);
      toast.success("Research complete! AI draft submitted for Jackye's review.");
    } catch (e: any) {
      if (e.message?.includes("429")) {
        toast.error("Research rate limit reached. Please try again later.");
      } else {
        toast.error(e.message || "Research failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted && draft) {
    return (
      <Card className={cn("border-primary/15", className)}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Draft Preview</p>
              <p className="text-[10px] text-muted-foreground">
                AI-generated preview · Jackye's official vetting is in progress
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> Unvetted — AI Research Draft
          </Badge>

          {draft.summary && (
            <DraftSection icon={Building2} title="Overview" text={draft.summary} />
          )}
          {draft.leadership && (
            <DraftSection icon={Users} title="Leadership" text={draft.leadership} />
          )}
          {draft.political && (
            <DraftSection icon={Landmark} title="Political Activity" text={draft.political} />
          )}
          {draft.controversies && (
            <DraftSection icon={AlertTriangle} title="Red Flags" text={draft.controversies} />
          )}

          {draft.citations?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {draft.citations.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                  Source [{i + 1}] <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-dashed border-border/40", className)}>
      <CardContent className="p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          <strong>{companyName}</strong> isn't in our vetted database yet.
        </p>
        <Textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional: Why do you need info on this company? (e.g., 'Got an offer', 'Interviewing next week')"
          rows={2}
          className="text-xs"
        />
        <Button
          onClick={handleResearch}
          disabled={loading}
          className="gap-2 w-full"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
          ) : (
            <><Search className="w-4 h-4" /> 🔍 Start Global Intelligence Scan</>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Powered by Perplexity AI · Results reviewed by Jackye Clayton
        </p>
      </CardContent>
    </Card>
  );
}

function DraftSection({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <p className="text-xs font-medium text-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
