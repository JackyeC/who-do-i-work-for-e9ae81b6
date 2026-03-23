import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Lock, Loader2, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/utils";

const CREDIT_PACKS = [
  { id: "single", label: "1 Report", price: "$4.99", credits: 1, cents: 499, popular: false },
  { id: "pack5", label: "5 Scans", price: "$9.99", credits: 5, cents: 999, popular: true, savings: "Save 60%" },
  { id: "pack20", label: "20 Scans", price: "$29.99", credits: 20, cents: 2999, popular: false, savings: "Best value" },
];

interface CreditPurchaseCardProps {
  /** Show inline (compact) or full card layout */
  variant?: "inline" | "card";
  /** Context message like "You've used all 3 free scans" */
  message?: string;
}

export function CreditPurchaseCard({ variant = "card", message }: CreditPurchaseCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { creditsRemaining } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setPurchasing(packId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { packId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({
        title: "Purchase failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (variant === "inline") {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {message || "Need more scans?"}
          </span>
          {creditsRemaining > 0 && (
            <Badge variant="secondary" className="text-xs ml-auto">{creditsRemaining} credits left</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {CREDIT_PACKS.map((pack) => (
            <Button
              key={pack.id}
              size="sm"
              variant={pack.popular ? "default" : "outline"}
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing === pack.id}
              className="flex-1 text-xs gap-1"
            >
              {purchasing === pack.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {pack.label} · {pack.price}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-2 border-primary/15 bg-muted/20">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-lg mb-1">
            {message || "Unlock More Reports"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Buy scan credits — no subscription required.
          </p>
        </div>

        <div className="grid gap-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchase(pack.id)}
              disabled={!!purchasing}
              className={cn(
                "relative flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                pack.popular
                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                  : "border-border/50 bg-card hover:bg-muted/50",
                purchasing === pack.id && "opacity-70"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                  pack.popular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {pack.credits}
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{pack.label}</span>
                  {pack.savings && (
                    <span className="ml-2 text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {pack.savings}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{pack.price}</span>
                {purchasing === pack.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                )}
              </div>
              {pack.popular && (
                <Badge className="absolute -top-2 right-3 text-xs bg-primary text-primary-foreground">
                  POPULAR
                </Badge>
              )}
            </button>
          ))}
        </div>

        {!user && (
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
            Sign up to purchase
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
