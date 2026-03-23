import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Copy, CheckCircle2, Loader2, Lightbulb, Sparkles, Heart, BarChart3, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PremiumGate } from "@/components/PremiumGate";
import { cn } from "@/lib/utils";
import type { LegalFlag } from "./CivicLegalAudit";
import type { RiskSignal } from "./OfferRiskSignals";

interface NegotiationPackage {
  collaborative: string;
  dataDriven: string;
  highValue: string;
  leverageInsights: { insight: string; source: string; action: string }[];
  suggestedAsk: string;
}

interface Props {
  companyName: string;
  roleTitle: string;
  baseSalary: number;
  bonus: string;
  equity: string;
  signOnBonus: string;
  annualBaseline: number;
  legalFlags: LegalFlag[];
  riskSignals: RiskSignal[];
  compPercentile?: string;
  userPriorities?: string[];
}

const EMAIL_TABS = [
  { key: "collaborative", label: "Collaborative", icon: Heart, desc: "Warm, relationship-first" },
  { key: "dataDriven", label: "Data-Driven", icon: BarChart3, desc: "Market benchmarks" },
  { key: "highValue", label: "High-Value", icon: Gem, desc: "Equity & long-term" },
] as const;

export function NegotiationCoach({
  companyName, roleTitle, baseSalary, bonus, equity, signOnBonus,
  annualBaseline, legalFlags, riskSignals, compPercentile, userPriorities,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NegotiationPackage | null>(null);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("negotiation-coach", {
        body: {
          companyName,
          roleTitle,
          baseSalary: String(baseSalary),
          bonus,
          equity,
          signOnBonus,
          signals: riskSignals.map(s => ({
            category: s.signal_category,
            value: s.normalized_value,
            direction: s.direction,
            summary: s.summary,
          })),
          legalFlags: legalFlags.map(f => ({
            category: f.category,
            severity: f.severity,
            title: f.title,
          })),
          compPercentile,
          annualBaseline: String(annualBaseline),
          userPriorities,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Coach unavailable",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(key);
    toast({ title: "Copied to clipboard", description: "Paste into your email client." });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div id="negotiate-coach" className="space-y-4">
      <PremiumGate
        feature="AI Negotiation Coach"
        description="Get 3 ready-to-send negotiation emails powered by company intelligence signals, legal analysis, and comp benchmarks."
        requiredTier="candidate"
        variant="blur"
        blurCta="Unlock AI-powered negotiation emails crafted from company intelligence."
      >
        <Card className="rounded-2xl border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-foreground">AI Negotiation Coach</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  3 email drafts powered by {companyName}'s intelligence profile
                </p>
              </div>
              <Badge className="ml-auto text-xs bg-primary/10 text-primary border-0 gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Generate 3 ready-to-send negotiation emails using {companyName}'s hiring signals, 
                  legal flags, and compensation benchmarks.
                </p>
                <Button onClick={generate} disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing signals...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" /> Generate My Negotiation Emails
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Suggested Ask */}
                {result.suggestedAsk && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs text-primary font-semibold mb-1">Recommended Counter</p>
                    <p className="text-sm text-foreground font-medium">{result.suggestedAsk}</p>
                  </div>
                )}

                {/* Email Tabs */}
                <Tabs defaultValue="collaborative">
                  <TabsList className="w-full">
                    {EMAIL_TABS.map(tab => (
                      <TabsTrigger key={tab.key} value={tab.key} className="flex-1 text-xs gap-1.5">
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {EMAIL_TABS.map(tab => (
                    <TabsContent key={tab.key} value={tab.key}>
                      <div className="relative p-4 bg-muted/30 rounded-xl border border-border/40 mt-3">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">{tab.desc}</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line pr-8">
                          {result[tab.key as keyof Pick<NegotiationPackage, "collaborative" | "dataDriven" | "highValue">]}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-7 w-7 p-0"
                          onClick={() =>
                            copyEmail(
                              result[tab.key as keyof Pick<NegotiationPackage, "collaborative" | "dataDriven" | "highValue">],
                              tab.key
                            )
                          }
                        >
                          {copiedTab === tab.key ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Leverage Insights */}
                {result.leverageInsights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[hsl(var(--civic-yellow))]" />
                      Leverage Insights
                    </h4>
                    {result.leverageInsights.map((li, i) => (
                      <div key={i} className="p-3 bg-[hsl(var(--civic-yellow))]/5 border border-[hsl(var(--civic-yellow))]/20 rounded-xl">
                        <p className="text-sm text-foreground font-medium">{li.insight}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge variant="outline" className="text-xs">{li.source}</Badge>
                          <p className="text-xs text-muted-foreground">{li.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regenerate */}
                <div className="text-center">
                  <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-1.5 text-xs">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PremiumGate>
    </div>
  );
}
