import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, Send, Quote, Loader2, Share2, Copy, Shield } from "lucide-react";

interface InsiderPrideProps {
  companyId: string;
  companyName: string;
  companySlug?: string;
  isVerified: boolean;
}

const BASE_URL = "https://wdiwf.jackyeclayton.com";

export function InsiderPrideBanner({ companyId, companyName, companySlug, isVerified }: InsiderPrideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileUrl = companySlug ? `${BASE_URL}/dossier/${companySlug}` : BASE_URL;
  const shareText = `I'm proud to work at a company that puts its receipts where its mouth is. 🛡️ See how ${companyName} aligns with your values on Who Do I Work For?\n\n${profileUrl}`;

  // Fetch approved testimonials
  const { data: testimonials } = useQuery({
    queryKey: ["insider-testimonials", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("insider_testimonials")
        .select("id, testimonial_text, created_at")
        .eq("company_id", companyId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to share your pride");
      const { error } = await (supabase as any)
        .from("insider_testimonials")
        .insert({
          user_id: user.id,
          company_id: companyId,
          testimonial_text: text.trim(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Your pride has been shared! 🎉", description: "It'll appear after a quick review." });
      setText("");
      setIsOpen(false);
      setShowShareCard(true);
      queryClient.invalidateQueries({ queryKey: ["insider-testimonials", companyId] });
    },
    onError: (err: any) => {
      toast({ title: "Couldn't submit", description: err.message, variant: "destructive" });
    },
  });

  if (!isVerified) return null;

  return (
    <div className="space-y-4">
      {/* Testimonials display */}
      {testimonials && testimonials.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-rose-500" /> Insider Wins
          </p>
          {testimonials.map((t: any) => (
            <div key={t.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
              <Quote className="w-3.5 h-3.5 text-primary/40 mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80 leading-relaxed italic">
                "{t.testimonial_text}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Post-submit share card */}
      {showShareCard && (
        <div className="p-5 rounded-xl border border-civic-gold/30 bg-primary/[0.03] space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-civic-gold" />
            <h3 className="font-serif text-base font-semibold text-foreground">Share Your Alignment</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I'm proud to work at a company that puts its receipts where its mouth is. 🛡️ See how{" "}
            <span className="text-primary font-medium">{companyName}</span> aligns with your values on Who Do I Work For?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
                window.open(url, "_blank", "width=600,height=600");
              }}
            >
              <Share2 className="w-3.5 h-3.5" /> Share on LinkedIn
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-civic-gold text-civic-gold hover:bg-civic-gold/10"
              onClick={() => {
                navigator.clipboard.writeText(shareText);
                toast({ title: "Copied to clipboard! 📋" });
              }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Share Text
            </Button>
          </div>
          <p className="text-xs text-civic-gold-muted flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> No judgment, just receipts.
          </p>
        </div>
      )}

      {/* Submit button & form */}
      {!isOpen && !showShareCard ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-rose-500/20 text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/30"
          onClick={() => setIsOpen(true)}
        >
          <Heart className="w-3.5 h-3.5" /> I Work Here & Love It
        </Button>
      ) : isOpen ? (
        <div className="p-4 rounded-lg border border-primary/15 bg-primary/[0.03] space-y-3">
          <p className="text-xs font-medium text-foreground">
            Share your Insider Win at <span className="text-primary">{companyName}</span>
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="e.g., 'They really stood by us during the healthcare changes.'"
            className="min-h-[60px] text-sm resize-none"
            maxLength={280}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length}/280</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsOpen(false); setText(""); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1"
                disabled={text.trim().length < 10 || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Share
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
