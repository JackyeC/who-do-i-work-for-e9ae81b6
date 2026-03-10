import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Lock, Unlock, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EquityData {
  grantType: "rsu" | "iso" | "nso";
  shares: number;
  strikePrice: number;
  currentValuation: number;
  vestingYears: number;
  cliffMonths: number;
}

export function EquityVisualizer() {
  const [data, setData] = useState<EquityData>({
    grantType: "rsu",
    shares: 0,
    strikePrice: 0,
    currentValuation: 0,
    vestingYears: 4,
    cliffMonths: 12,
  });

  const update = <K extends keyof EquityData>(key: K, val: EquityData[K]) => {
    setData(d => ({ ...d, [key]: val }));
  };

  const timeline = useMemo(() => {
    if (!data.shares || !data.currentValuation) return [];
    const totalMonths = data.vestingYears * 12;
    const cliffShares = Math.floor(data.shares / data.vestingYears);
    const monthlyAfterCliff = (data.shares - cliffShares) / (totalMonths - data.cliffMonths);

    const years = [];
    let vestedSoFar = 0;

    for (let y = 1; y <= data.vestingYears; y++) {
      if (y === 1) {
        vestedSoFar = cliffShares;
      } else {
        vestedSoFar += Math.floor(monthlyAfterCliff * 12);
      }
      vestedSoFar = Math.min(vestedSoFar, data.shares);

      const grossValue = data.grantType === "rsu"
        ? vestedSoFar * data.currentValuation
        : vestedSoFar * Math.max(0, data.currentValuation - data.strikePrice);

      const taxRate = data.grantType === "rsu" ? 0.35 : data.grantType === "iso" ? 0.15 : 0.30;
      const taxHit = grossValue * taxRate;
      const netValue = grossValue - taxHit;

      years.push({
        year: y,
        vestedShares: vestedSoFar,
        grossValue,
        taxHit,
        netValue,
        isCliff: y === 1,
        isLocked: y === 1 && data.cliffMonths > 0,
      });
    }
    return years;
  }, [data]);

  const totalGross = timeline.length > 0 ? timeline[timeline.length - 1].grossValue : 0;
  const totalNet = timeline.length > 0 ? timeline[timeline.length - 1].netValue : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-foreground mb-1">
          Equity & Upside Calculator
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Equity isn't cash. This calculator shows when those "golden handcuffs" actually turn into money — and how much Uncle Sam takes first.
        </p>
      </div>

      <Card className="border-border/40 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Grant Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Grant Type</label>
              <Select value={data.grantType} onValueChange={v => update("grantType", v as EquityData["grantType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rsu">RSUs (Restricted Stock Units)</SelectItem>
                  <SelectItem value="iso">ISOs (Incentive Stock Options)</SelectItem>
                  <SelectItem value="nso">NSOs (Non-Qualified Options)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Number of Shares</label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={data.shares || ""}
                onChange={e => update("shares", Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {(data.grantType === "iso" || data.grantType === "nso") && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Strike Price ($)</label>
              <Input
                type="number"
                placeholder="e.g. 15.00"
                value={data.strikePrice || ""}
                onChange={e => update("strikePrice", Number(e.target.value) || 0)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {data.grantType === "rsu" ? "Current Share Price ($)" : "Current 409A Valuation ($)"}
              </label>
              <Input
                type="number"
                placeholder="e.g. 50.00"
                value={data.currentValuation || ""}
                onChange={e => update("currentValuation", Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Vesting Schedule</label>
              <Select value={String(data.vestingYears)} onValueChange={v => update("vestingYears", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3-year vest</SelectItem>
                  <SelectItem value="4">4-year vest (standard)</SelectItem>
                  <SelectItem value="5">5-year vest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cliff Period</label>
            <Select value={String(data.cliffMonths)} onValueChange={v => update("cliffMonths", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No cliff</SelectItem>
                <SelectItem value="6">6-month cliff</SelectItem>
                <SelectItem value="12">1-year cliff (standard)</SelectItem>
                <SelectItem value="18">18-month cliff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tax Alerts */}
      {data.shares > 0 && data.currentValuation > 0 && (
        <>
          {data.grantType === "rsu" && (
            <div className="flex items-start gap-3 p-4 bg-civic-yellow/5 border border-civic-yellow/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-civic-yellow mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">RSU Tax Alert</p>
                <p className="text-xs text-muted-foreground">
                  RSUs are taxed as ordinary income the moment they vest — estimated <span className="font-semibold text-civic-yellow">30–40% tax liability</span> due immediately upon vesting.
                  You don't choose when to pay; it happens automatically. Many people are blindsided by this.
                </p>
              </div>
            </div>
          )}
          {data.grantType === "iso" && (
            <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">ISO AMT Alert</p>
                <p className="text-xs text-muted-foreground">
                  Exercising ISOs can trigger the <span className="font-semibold text-destructive">Alternative Minimum Tax (AMT)</span> — a shadow tax system.
                  If you exercise and hold past calendar year-end, the "spread" (market value minus strike) counts as AMT income, even if you haven't sold a single share. Consult a tax professional.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vesting Timeline */}
      {timeline.length > 0 && (
        <Card className="border-border/40 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Golden Handcuffs Timeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">When your equity actually becomes cash</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.map(year => {
                const pctOfTotal = year.grossValue / (totalGross || 1) * 100;
                return (
                  <div key={year.year} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {year.isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-civic-yellow" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-civic-green" />
                        )}
                        <span className="text-sm font-medium text-foreground">Year {year.year}</span>
                        {year.isCliff && <Badge variant="outline" className="text-[9px]">Cliff</Badge>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-semibold text-foreground">${year.netValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">net</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-civic-green/30 rounded-l-full"
                          style={{ width: `${(year.netValue / (year.grossValue || 1)) * pctOfTotal}%` }}
                        />
                        <div
                          className="h-full bg-destructive/20"
                          style={{ width: `${(year.taxHit / (year.grossValue || 1)) * pctOfTotal}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-24 text-right">
                        {year.vestedShares.toLocaleString()} shares
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground pl-5">
                      <span>Gross: ${year.grossValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      <span className="text-destructive">Tax: ~${year.taxHit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Gross Value</p>
                <p className="text-lg font-display font-bold text-foreground">${totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="p-3 bg-civic-green/5 rounded-xl border border-civic-green/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estimated Net</p>
                <p className="text-lg font-display font-bold text-civic-green">${totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
