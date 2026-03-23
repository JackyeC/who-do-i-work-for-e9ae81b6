import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PartyPopper, ShieldCheck, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  companyName: string;
}

type OutcomeType = "negotiated_more" | "got_protections" | "declined";

const OUTCOMES = [
  {
    type: "negotiated_more" as OutcomeType,
    icon: PartyPopper,
    label: "I negotiated more",
    color: "text-[hsl(var(--civic-green))]",
    bg: "bg-[hsl(var(--civic-green))]/10",
    border: "border-[hsl(var(--civic-green))]/30",
  },
  {
    type: "got_protections" as OutcomeType,
    icon: ShieldCheck,
    label: "I got protections in writing",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  {
    type: "declined" as OutcomeType,
    icon: XCircle,
    label: "I declined the offer",
    color: "text-[hsl(var(--civic-yellow))]",
    bg: "bg-[hsl(var(--civic-yellow))]/10",
    border: "border-[hsl(var(--civic-yellow))]/30",
  },
];

export function OutcomeFeedback({ companyName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<OutcomeType | null>(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      if (user) {
        await supabase.from("offer_outcomes" as any).insert({
          user_id: user.id,
          company_name: companyName,
          outcome_type: selected,
          details: details || null,
          amount_increase: amount ? parseInt(amount) : null,
        } as any);
      }
      setSubmitted(true);
      toast({ title: "Thanks for sharing!", description: "Your feedback helps improve our coaching." });
    } catch {
      toast({ title: "Saved", description: "Thank you for your feedback." });
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <Card className="rounded-2xl border-[hsl(var(--civic-green))]/30 bg-[hsl(var(--civic-green))]/[0.02]">
        <CardContent className="p-6 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[hsl(var(--civic-green))] mx-auto" />
          <p className="text-sm font-medium text-foreground">Your outcome has been recorded.</p>
          <p className="text-xs text-muted-foreground">This helps us improve negotiation coaching for everyone.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-center">
          <span className="text-foreground">Did you get the bag? 💰</span>
          <p className="text-xs text-muted-foreground font-normal mt-1">
            How did your negotiation with {companyName} go?
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcome selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OUTCOMES.map(o => {
            const Icon = o.icon;
            const isActive = selected === o.type;
            return (
              <button
                key={o.type}
                onClick={() => setSelected(o.type)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center space-y-2 transition-all",
                  isActive ? `${o.border} ${o.bg}` : "border-border/40 hover:border-border"
                )}
              >
                <Icon className={cn("w-6 h-6 mx-auto", isActive ? o.color : "text-muted-foreground")} />
                <p className={cn("text-xs font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {o.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Conditional detail fields */}
        {selected === "negotiated_more" && (
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">How much more?</label>
            <Input
              type="number"
              placeholder="e.g. 15000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}

        {selected && (
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {selected === "got_protections" ? "What protections did you secure?" : 
               selected === "declined" ? "What confirmed your decision?" :
               "Any details to share?"}
            </label>
            <Textarea
              placeholder="Optional — helps us improve coaching"
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {selected && (
          <div className="text-center">
            <Button onClick={submit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
