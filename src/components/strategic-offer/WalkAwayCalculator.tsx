import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, DollarSign, Home, Car, Heart, CreditCard, PiggyBank, UtensilsCrossed, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalkAwayData {
  housing: number;
  food: number;
  transportation: number;
  insurance: number;
  debtTaxes: number;
  savings: number;
}

interface Props {
  onComplete: (annualBaseline: number) => void;
  offerSalary?: number;
}

const CATEGORIES = [
  { key: "housing" as const, label: "Housing", sublabel: "Rent/mortgage, utilities, internet", icon: Home },
  { key: "food" as const, label: "Food & Clothing", sublabel: "Groceries, dining, essentials", icon: UtensilsCrossed },
  { key: "transportation" as const, label: "Transportation", sublabel: "Car payment, gas, transit", icon: Car },
  { key: "insurance" as const, label: "Insurance & Medical", sublabel: "Health, dental, prescriptions", icon: Heart },
  { key: "debtTaxes" as const, label: "Debt & Taxes", sublabel: "Student loans, credit cards, estimated taxes", icon: CreditCard },
  { key: "savings" as const, label: "Savings Goals", sublabel: "Emergency fund, retirement, investments", icon: PiggyBank },
];

export function WalkAwayCalculator({ onComplete, offerSalary }: Props) {
  const [data, setData] = useState<WalkAwayData>({
    housing: 0, food: 0, transportation: 0,
    insurance: 0, debtTaxes: 0, savings: 0,
  });

  const update = (key: keyof WalkAwayData, val: string) => {
    setData(d => ({ ...d, [key]: Number(val) || 0 }));
  };

  const monthlyTotal = useMemo(() =>
    Object.values(data).reduce((s, v) => s + v, 0), [data]);
  const annualBaseline = monthlyTotal * 12;

  const isBelowLine = offerSalary !== undefined && offerSalary > 0 && offerSalary < annualBaseline;
  const isAboveLine = offerSalary !== undefined && offerSalary > 0 && offerSalary >= annualBaseline;
  const margin = offerSalary ? ((offerSalary - annualBaseline) / annualBaseline * 100) : 0;

  const barMax = Math.max(annualBaseline, offerSalary || 0) * 1.2 || 100000;
  const baselinePct = (annualBaseline / barMax) * 100;
  const offerPct = offerSalary ? (offerSalary / barMax) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">
          Step 1: Your Walk-Away Number
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Before evaluating any offer, know your bottom line. This is a common pitfall — most people skip this step and accept offers that don't cover real expenses.
        </p>
      </div>

      <Card className="border-border/40 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Monthly Expenses
          </CardTitle>
          <p className="text-xs text-muted-foreground">Enter your actual monthly costs — be honest with yourself.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium text-foreground block">{cat.label}</label>
                  <span className="text-xs text-muted-foreground">{cat.sublabel}</span>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={data[cat.key] || ""}
                    onChange={e => update(cat.key, e.target.value)}
                    className="pl-7 text-right h-9 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Results visualization */}
      {monthlyTotal > 0 && (
        <Card className="border-border/40 rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Total</p>
                <p className="text-xl font-display font-bold text-foreground">
                  ${monthlyTotal.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Safety Line</p>
                <p className="text-xl font-display font-bold text-primary">
                  ${annualBaseline.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">annual minimum</p>
              </div>
            </div>

            {/* Visual comparison bar */}
            {offerSalary !== undefined && offerSalary > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-foreground">Offer vs. Safety Line</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 text-right">Safety Line</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-destructive/20 border-r-2 border-destructive rounded-full"
                        style={{ width: `${baselinePct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-20">${annualBaseline.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 text-right">Offer</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isBelowLine ? "bg-destructive/30 border-r-2 border-destructive" : "bg-civic-green/30 border-r-2 border-civic-green"
                        )}
                        style={{ width: `${offerPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-20">${offerSalary.toLocaleString()}</span>
                  </div>
                </div>

                {isBelowLine && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Financial Sustainability Risk</p>
                      <p className="text-xs text-muted-foreground">
                        This offer is <span className="font-semibold text-destructive">{Math.abs(margin).toFixed(0)}% below</span> your calculated living wage.
                        You have leverage here — this is a non-negotiable baseline, not a wish list.
                      </p>
                    </div>
                  </div>
                )}
                {isAboveLine && (
                  <div className="flex items-start gap-2 p-3 bg-civic-green/5 border border-civic-green/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-civic-green mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-civic-green">Above Safety Line</p>
                      <p className="text-xs text-muted-foreground">
                        This offer is <span className="font-semibold text-civic-green">{margin.toFixed(0)}% above</span> your baseline.
                        You're in a position to negotiate for additional benefits or equity.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete(annualBaseline)}
          disabled={monthlyTotal === 0}
          className="gap-2"
        >
          Continue to Offer Details <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
