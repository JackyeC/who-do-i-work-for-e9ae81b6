import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, Copy, FileCheck, Loader2, Sparkles, Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PremiumGate } from "@/components/PremiumGate";
import type { RiskSignal } from "./OfferRiskSignals";

interface AcceptanceEmailResult {
  subject: string;
  body: string;
}

interface Props {
  companyName: string;
  roleTitle: string;
  baseSalary: number;
  bonus: string;
  equity: string;
  signOnBonus: string;
  riskSignals: RiskSignal[];
}

const NEGOTIATED_TERM_OPTIONS = [
  "Base salary",
  "Equity / RSU structure",
  "Sign-on bonus",
  "Remote / hybrid schedule",
  "Start date",
  "Title adjustment",
  "Relocation package",
  "Professional development budget",
];

export function AcceptanceEmail({
  companyName, roleTitle, baseSalary, bonus, equity, signOnBonus, riskSignals,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AcceptanceEmailResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [userName, setUserName] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [customTerm, setCustomTerm] = useState("");

  const toggleTerm = (term: string) => {
    setSelectedTerms(prev =>
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    );
  };

  const generate = async () => {
    setLoading(true);
    try {
      const allTerms = [...selectedTerms, ...(customTerm ? [customTerm] : [])];
      const { data, error } = await supabase.functions.invoke("acceptance-email", {
        body: {
          companyName,
          roleTitle,
          baseSalary: String(baseSalary),
          bonus,
          equity,
          signOnBonus,
          startDate,
          recruiterName,
          userName,
          departmentName,
          negotiatedTerms: allTerms,
          topSignals: riskSignals.slice(0, 5).map(s => ({
            signal_category: s.signal_category,
            summary: s.summary,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Generation failed",
        description: e.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "Paste into your email client." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="acceptance-email" className="space-y-4">
      <PremiumGate
        feature="Offer Acceptance Email"
        description="Generate a professional acceptance email that documents your intelligence-backed negotiation wins."
        requiredTier="candidate"
        variant="blur"
        blurCta="Unlock your AI-crafted acceptance email."
      >
        <Card className="rounded-2xl border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-foreground">Offer Acceptance Email</span>
                <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                  The "Closing Script" — document your negotiated terms
                </p>
              </div>
              <Badge className="ml-auto text-[9px] bg-primary/10 text-primary border-0 gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="space-y-4">
                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Your Name</Label>
                    <Input
                      placeholder="Jane Doe"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Recruiter / Hiring Manager</Label>
                    <Input
                      placeholder="Sarah Johnson"
                      value={recruiterName}
                      onChange={e => setRecruiterName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      placeholder="March 31, 2026"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department / Team</Label>
                    <Input
                      placeholder="Engineering"
                      value={departmentName}
                      onChange={e => setDepartmentName(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Negotiated terms chips */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Terms You Clarified or Negotiated</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEGOTIATED_TERM_OPTIONS.map(term => (
                      <Badge
                        key={term}
                        variant={selectedTerms.includes(term) ? "default" : "outline"}
                        className="cursor-pointer text-[10px] transition-colors"
                        onClick={() => toggleTerm(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Other term (optional)"
                    value={customTerm}
                    onChange={e => setCustomTerm(e.target.value)}
                    className="h-8 text-xs mt-1.5"
                  />
                </div>

                <div className="text-center pt-2">
                  <Button onClick={generate} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Crafting your email...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" /> Generate Acceptance Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject line */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-[10px] text-primary font-semibold mb-1">Subject Line</p>
                  <p className="text-sm text-foreground font-medium font-mono">{result.subject}</p>
                </div>

                {/* Email body */}
                <div className="relative p-4 bg-muted/30 rounded-xl border border-border/40">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line pr-8">
                    {result.body}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={copyAll}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--civic-green))]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => setResult(null)} className="gap-1.5 text-xs">
                    Edit Details
                  </Button>
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
