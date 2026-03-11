import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, AlertTriangle, Zap, MapPin,
  DollarSign, BarChart3, Building2, Shield, Sparkles, ArrowRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StabilityGauge } from "./StabilityGauge";
import { BLSWageBenchmarkCard } from "@/components/bls/BLSWageBenchmarkCard";
import { BLSECITrendCard } from "@/components/bls/BLSECITrendCard";
import {
  HIGH_VELOCITY_PATHS, DECLINING_PATHS, INDUSTRY_PULSE_2026, SECTOR_GDP_2026,
  AFFORDABILITY_MARKETS, EARLY_CAREER_AI_SIGNAL,
  getOccupationalOutlook, getSectorVolatility, getAffordabilityBridge,
  computeStabilityScore, isEarlyCareer,
  type OccupationalOutlook, type IndustryPulse, type AffordabilityMarket,
} from "@/data/economicIntelligence2026";
import type { CareerProfile } from "@/hooks/use-career-discovery";

interface Props {
  profile: CareerProfile;
}

export function EconomicIntelligenceStep({ profile }: Props) {
  const { matchedGrowth, matchedDecline, pivotRequired } = useMemo(
    () => getOccupationalOutlook(profile.jobTitle, [...profile.technicalSkills, ...profile.softSkills]),
    [profile.jobTitle, profile.technicalSkills, profile.softSkills],
  );

  const sectorSignals = useMemo(
    () => getSectorVolatility(profile.industries),
    [profile.industries],
  );

  const earlyCareer = isEarlyCareer(profile.yearsExperience);

  // Compute a representative stability score
  const stabilityScore = useMemo(() => {
    const bestGrowth = matchedGrowth.length > 0 ? Math.max(...matchedGrowth.map(g => g.growthPct)) : 5;
    const avgPmi = sectorSignals.length > 0 ? sectorSignals.reduce((a, b) => a + b.pmiValue, 0) / sectorSignals.length : 52;
    const gdpMatch = SECTOR_GDP_2026.find(s => profile.industries.some(i => s.sector.toLowerCase().includes(i.toLowerCase())));
    const gdpGrowth = gdpMatch?.gdpGrowthPct ?? 2.0;
    return computeStabilityScore(bestGrowth, avgPmi, gdpGrowth);
  }, [matchedGrowth, sectorSignals, profile.industries]);

  const affordabilityMarkets = getAffordabilityBridge();

  return (
    <div className="space-y-6">
      {/* Header with Stability Gauge */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
            <StabilityGauge score={stabilityScore} label="Based on BLS, FRED, and BEA data" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground font-display mb-1">Your 2026 Economic Outlook</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Personalized stability score based on occupation growth projections, sector PMI, and GDP trends.
              </p>
              <div className="flex flex-wrap gap-2">
                {matchedGrowth.length > 0 && (
                  <Badge className="bg-[hsl(var(--civic-green))]/10 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/20 text-[10px]">
                    <TrendingUp className="w-3 h-3 mr-1" /> {matchedGrowth.length} high-growth skill match{matchedGrowth.length > 1 ? "es" : ""}
                  </Badge>
                )}
                {pivotRequired && (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Pivot Alert
                  </Badge>
                )}
                {sectorSignals.some(s => s.trend === "contracting") && (
                  <Badge className="bg-[hsl(var(--civic-yellow))]/10 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/20 text-[10px]">
                    <Activity className="w-3 h-3 mr-1" /> Sector Volatility
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Required Alert */}
      {pivotRequired && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Pivot Required</AlertTitle>
          <AlertDescription className="text-xs">
            <p className="mb-2">BLS projects decline in roles matching your profile. Consider pivoting to adjacent high-growth fields:</p>
            {matchedDecline.map(d => (
              <div key={d.occupation} className="mb-2">
                <span className="font-medium text-foreground">{d.occupation}</span>
                <span className="text-destructive font-semibold ml-1">({d.growthPct}%)</span>
                {d.adjacentPivots && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <ArrowRight className="w-3 h-3 text-[hsl(var(--civic-green))] shrink-0 mt-0.5" />
                    {d.adjacentPivots.map(p => (
                      <Badge key={p} variant="outline" className="text-[10px] border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]">{p}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Early Career AI Signal */}
      {earlyCareer && (
        <Alert className="border-[hsl(var(--civic-blue))]/30 bg-[hsl(var(--civic-blue))]/5">
          <Sparkles className="h-4 w-4 text-[hsl(var(--civic-blue))]" />
          <AlertTitle className="text-sm font-semibold text-foreground">Early-Career AI Signal</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            <p className="mb-2">{EARLY_CAREER_AI_SIGNAL.headline}</p>
            <p className="font-medium text-foreground mb-1">{EARLY_CAREER_AI_SIGNAL.strategy}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {EARLY_CAREER_AI_SIGNAL.recommendedSkills.map(s => (
                <Badge key={s} className="text-[10px] bg-[hsl(var(--civic-blue))]/10 text-[hsl(var(--civic-blue))] border-[hsl(var(--civic-blue))]/20">{s}</Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Source: {EARLY_CAREER_AI_SIGNAL.source}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* BLS: Opportunity Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-[hsl(var(--civic-green))]" />
            High-Velocity Career Paths
          </CardTitle>
          <p className="text-xs text-muted-foreground">BLS 2024–2034 National Employment Matrix — fastest growing occupations matching your skills.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(matchedGrowth.length > 0 ? matchedGrowth : HIGH_VELOCITY_PATHS.slice(0, 5)).map(path => (
            <OccupationRow key={path.occupation} data={path} />
          ))}
          {matchedGrowth.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No direct skill matches found — showing top national growth paths. Consider building skills in these areas.</p>
          )}
        </CardContent>
      </Card>

      {/* FRED: Sector Pulse */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-[hsl(var(--civic-blue))]" />
            Sector Pulse — Q1 2026
          </CardTitle>
          <p className="text-xs text-muted-foreground">FRED Business Survey PMI data. Below 50 = contraction.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {INDUSTRY_PULSE_2026.map(pulse => (
            <SectorPulseRow key={pulse.sector} data={pulse} highlighted={sectorSignals.some(s => s.sector === pulse.sector)} />
          ))}
        </CardContent>
      </Card>

      {/* BEA: GDP Sectors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            GDP Growth by Sector — BEA Q1 2026
          </CardTitle>
          <p className="text-xs text-muted-foreground">Real GDP by industry. Higher growth = more opportunity and job creation.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {SECTOR_GDP_2026.map(sector => (
            <div key={sector.sector} className="p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{sector.sector}</span>
                    <Badge variant={sector.gdpGrowthPct > 2 ? "default" : sector.gdpGrowthPct > 0 ? "secondary" : "destructive"} className="text-[10px]">
                      {sector.gdpGrowthPct > 0 ? "+" : ""}{sector.gdpGrowthPct}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">{sector.opportunity}</p>
                  <div className="flex flex-wrap gap-1">
                    {sector.topRoles.map(r => (
                      <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Zillow: Affordability Bridge */}
      <Card className="border-[hsl(var(--civic-gold))]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[hsl(var(--civic-gold))]" />
            Affordability Bridge — 2026 Markets
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Zillow forecast: metros where incomes are rising faster than rents. "Small Win" markets for remote workers.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {affordabilityMarkets.filter(m => m.category !== "high-cost").map(market => (
              <AffordabilityCard key={market.metro} data={market} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data sources */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Data sources:</span> BLS National Employment Matrix (2024–2034 projections),
          FRED Business Survey Indexes (ISM PMI, Q1 2026), BEA Real GDP by Industry (Q4 2025–Q1 2026),
          Zillow Market Forecast (March 2026), Anthropic/BLS Working Paper (March 2026).
          Stability scores are modeled estimates and should not be used as sole career decision factors.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ──

function OccupationRow({ data }: { data: OccupationalOutlook }) {
  const isDecline = data.growthPct < 0;
  return (
    <div className={cn("p-3 rounded-lg border transition-colors", isDecline ? "border-destructive/20 bg-destructive/5" : "border-[hsl(var(--civic-green))]/15 bg-[hsl(var(--civic-green))]/5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isDecline ? <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" /> : <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--civic-green))] shrink-0" />}
            <span className="text-sm font-semibold text-foreground">{data.occupation}</span>
            {data.velocity === "high-velocity" && (
              <Badge className="text-[10px] bg-[hsl(var(--civic-green))]/15 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/25">High Velocity</Badge>
            )}
            {data.velocity === "saturated" && (
              <Badge variant="destructive" className="text-[10px]">Saturated</Badge>
            )}
          </div>
          {data.medianSalary && <p className="text-xs text-muted-foreground mt-0.5">Median: {data.medianSalary}</p>}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {data.relatedSkills.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("text-lg font-bold", isDecline ? "text-destructive" : "text-[hsl(var(--civic-green))]")}>
            {data.growthPct > 0 ? "+" : ""}{data.growthPct}%
          </div>
          <p className="text-[10px] text-muted-foreground">10yr growth</p>
        </div>
      </div>
    </div>
  );
}

function SectorPulseRow({ data, highlighted }: { data: IndustryPulse; highlighted: boolean }) {
  const color = data.pmiValue >= 55 ? "bg-[hsl(var(--civic-green))]" : data.pmiValue >= 50 ? "bg-[hsl(var(--civic-yellow))]" : "bg-destructive";
  return (
    <div className={cn("p-3 rounded-lg border transition-colors", highlighted ? "border-primary/30 bg-primary/5" : "border-border")}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{data.sector}</span>
            {highlighted && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Your industry</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{data.signal}</p>
          {data.investmentSignal && (
            <p className="text-xs text-[hsl(var(--civic-blue))] mt-0.5 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> {data.investmentSignal}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
            <span className="text-base font-bold text-foreground">{data.pmiValue}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">PMI</p>
        </div>
      </div>
    </div>
  );
}

function AffordabilityCard({ data }: { data: AffordabilityMarket }) {
  return (
    <div className="p-3 rounded-xl border border-[hsl(var(--civic-gold))]/15 bg-[hsl(var(--civic-gold-light))]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{data.metro}</p>
          <Badge variant="outline" className="text-[10px] mt-0.5 border-[hsl(var(--civic-gold))]/30">
            {data.category === "small-win" ? "Small Win Market" : "Emerging Market"}
          </Badge>
        </div>
        {data.purchasingPowerBonus && (
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-[hsl(var(--civic-green))]">+{data.purchasingPowerBonus}%</div>
            <p className="text-[10px] text-muted-foreground">purchasing power</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-muted-foreground">Median Rent</p>
          <p className="font-semibold text-foreground">${data.medianRent.toLocaleString()}/mo</p>
        </div>
        <div>
          <p className="text-muted-foreground">Income Growth</p>
          <p className="font-semibold text-[hsl(var(--civic-green))]">+{data.incomeGrowthYoY}% YoY</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rent Growth</p>
          <p className="font-semibold text-foreground">+{data.rentGrowthYoY}% YoY</p>
        </div>
        <div>
          <p className="text-muted-foreground">Income-to-Rent</p>
          <p className="font-semibold text-foreground">{data.incomeToRentRatio}x</p>
        </div>
      </div>
    </div>
  );
}
