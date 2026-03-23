import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileSearch, Loader2, ArrowRight, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CareerFitReportCTAProps {
  companyName?: string;
  variant?: "hero" | "inline" | "card";
}

export function CareerFitReportCTA({ companyName: initialCompany, variant = "card" }: CareerFitReportCTAProps) {
  const [company, setCompany] = useState(initialCompany || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!company.trim()) {
      toast.error("Please enter a company name.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("anonymous-checkout", {
        body: {
          productKey: "career-fit-report",
          email: email.trim() || undefined,
          companyName: company.trim(),
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">Career Fit Report — $49</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Get a full intelligence scan on any company. No account required.
        </p>
        <div className="flex gap-2">
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="flex-1"
          />
          <Button onClick={handlePurchase} disabled={loading} size="sm" className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Get Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Career Fit Report — $49</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Get a full company intelligence scan before you apply or accept. Compensation benchmarks, 
              culture signals, leadership analysis, and risk flags — delivered to your inbox. 
              <strong className="text-foreground"> No account required.</strong>
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Privacy-first</span>
              <span>·</span>
              <span>Delivered in 24-48 hours</span>
              <span>·</span>
              <span>Public records + expert analysis</span>
            </div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[260px] space-y-2">
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
            />
            <Button onClick={handlePurchase} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Get Your Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
