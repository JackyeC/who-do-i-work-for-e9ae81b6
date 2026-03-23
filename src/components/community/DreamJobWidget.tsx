import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Compass, Loader2, Share2, Sparkles, Lock, Copy, Shield } from "lucide-react";

const BASE_URL = "https://wdiwf.jackyeclayton.com";

export function DreamJobWidget() {
  const [dreamRole, setDreamRole] = useState("");
  const [dreamCompany, setDreamCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [matchedCompanyName, setMatchedCompanyName] = useState("");
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to map your aligned role");

      const slug = dreamCompany.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: existing } = await supabase
        .from("companies")
        .select("id, name, vetted_status")
        .or(`slug.eq.${slug},name.ilike.%${dreamCompany}%`)
        .limit(1)
        .maybeSingle();

      const matchedId = existing?.id || null;
      const status = existing ? (existing.vetted_status === "certified" || existing.vetted_status === "verified" ? "matched" : "intelligence_requested") : "intelligence_requested";

      const { error } = await (supabase as any)
        .from("dream_job_requests")
        .insert({
          user_id: user.id,
          dream_role: dreamRole.trim(),
          dream_company_name: dreamCompany.trim(),
          matched_company_id: matchedId,
          intelligence_status: status,
        });
      if (error) throw error;

      setMatchedCompanyName(dreamCompany.trim());
      return { status, companyName: existing?.name || dreamCompany.trim() };
    },
    onSuccess: (result) => {
      setSubmitted(true);
      if (result.status === "intelligence_requested") {
        toast({
          title: "Intelligence Request Submitted 🛡️",
          description: `We're prioritizing an audit of ${result.companyName}. We'll notify you when the receipts are ready.`,
        });
      } else {
        toast({
          title: "Aligned role mapped! ✨",
          description: `${result.companyName} is already in our system. Check their profile for the full intelligence report.`,
        });
      }
    },
    onError: (err: any) => {
      toast({ title: "Couldn't submit", description: err.message, variant: "destructive" });
    },
  });

  const linkedInShareText = `I just mapped my values to my aligned role at ${matchedCompanyName}. It's time we knew who we really worked for. Check your alignment at ${BASE_URL}`;
  const copyShareText = `I just mapped my values to my aligned role at ${matchedCompanyName}. It's time we knew who we really worked for. Check your alignment → ${BASE_URL}`;

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 border border-civic-gold/30 bg-primary/[0.03] rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-civic-gold" />
          <h3 className="font-serif text-lg text-foreground">Manifested. 🚀</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We're auditing the receipts for <span className="text-primary font-medium">{matchedCompanyName}</span> to help you get there.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BASE_URL)}&summary=${encodeURIComponent(linkedInShareText)}`;
              window.open(url, '_blank', 'width=600,height=600');
            }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share on LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-civic-gold text-civic-gold hover:bg-civic-gold/10"
            onClick={() => {
              navigator.clipboard.writeText(copyShareText);
              toast({ title: "Copied to clipboard! 📋" });
            }}
          >
            <Copy className="w-3.5 h-3.5" /> Copy Share Text
          </Button>
        </div>
        <p className="text-xs text-civic-gold-muted flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" /> No judgment, just receipts.
        </p>
        <Button variant="link" size="sm" className="px-0" onClick={() => { setSubmitted(false); setDreamRole(""); setDreamCompany(""); }}>
          Map another aligned role →
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 border border-border bg-card rounded-xl space-y-5">
      <div>
        <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-2">Where Do You Belong?</div>
        <h3 className="font-serif text-xl text-foreground mb-1">Map Your Aligned Role</h3>
        <p className="text-sm text-muted-foreground">
          Tell us where you want to be — and we'll get the receipts before you get the offer.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={dreamRole}
          onChange={(e) => setDreamRole(e.target.value)}
          placeholder="What is your ideal aligned role?"
          maxLength={120}
        />
        <Input
          value={dreamCompany}
          onChange={(e) => setDreamCompany(e.target.value)}
          placeholder="Which company matches your values?"
          maxLength={120}
        />
      </div>

      <Button
        className="w-full gap-2"
        disabled={!dreamRole.trim() || !dreamCompany.trim() || submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Compass className="w-4 h-4" />
        )}
        Map My Values
      </Button>

      <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
        <Lock className="w-2.5 h-2.5" /> Your aligned role stays private. We only use it to prioritize intelligence requests.
      </p>
    </div>
  );
}
