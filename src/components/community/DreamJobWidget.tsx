import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Compass, Send, Loader2, Share2, Sparkles, Lock } from "lucide-react";

export function DreamJobWidget() {
  const [dreamRole, setDreamRole] = useState("");
  const [dreamCompany, setDreamCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [matchedCompanyName, setMatchedCompanyName] = useState("");
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to manifest your dream job");

      // Check if company exists
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
          title: "Dream job mapped! ✨",
          description: `${result.companyName} is already in our system. Check their profile for the full intelligence report.`,
        });
      }
    },
    onError: (err: any) => {
      toast({ title: "Couldn't submit", description: err.message, variant: "destructive" });
    },
  });

  const shareText = `I just mapped my values to my dream role at ${matchedCompanyName} on Who Do I Work For? 🛡️ Check your alignment.`;
  const shareUrl = "https://who-do-i-work-for.lovable.app";

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 border border-primary/15 bg-primary/[0.03] rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg text-foreground">Dream job mapped.</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Intelligence Gathering in Progress... We are verifying the receipts to ensure 100% accuracy for your dream match.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
              window.open(url, '_blank', 'width=600,height=400');
            }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share on LinkedIn
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
              toast({ title: "Copied to clipboard!" });
            }}
          >
            Copy Share Text
          </Button>
        </div>
        <Button variant="link" size="sm" className="px-0" onClick={() => { setSubmitted(false); setDreamRole(""); setDreamCompany(""); }}>
          Map another dream job →
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 border border-border bg-card rounded-xl space-y-5">
      <div>
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-2">Where Do You Belong?</div>
        <h3 className="font-serif text-xl text-foreground mb-1">Manifest Your Dream Job</h3>
        <p className="text-sm text-muted-foreground">
          Tell us where you want to be — and we'll get the receipts before you get the offer.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={dreamRole}
          onChange={(e) => setDreamRole(e.target.value)}
          placeholder="What is your dream role?"
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

      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
        <Lock className="w-2.5 h-2.5" /> Your dream job stays private. We only use it to prioritize intelligence requests.
      </p>
    </div>
  );
}
