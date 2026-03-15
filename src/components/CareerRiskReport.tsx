import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import {
  Share2, Download, Copy, Check, Linkedin, Link2,
  Shield, TrendingDown, Landmark, Zap, DollarSign,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { preGenerateOGCard } from "@/lib/social-share";

/* ─── Risk Dimension ─── */

interface RiskDimension {
  label: string;
  value: number; // 0–100 (100 = highest risk)
  level: "Low" | "Medium" | "High" | "Elevated";
}

interface CareerRiskReportProps {
  companyName: string;
  slug: string;
  ticker?: string | null;
  industry: string;
  // Data inputs
  hasLayoffSignals: boolean;
  hasWarnNotices: boolean;
  totalPacSpending: number;
  lobbyingSpend: number;
  hasDarkMoney: boolean;
  hasPayTransparency: boolean;
  hasSentimentData: boolean;
  hasBenefitsData: boolean;
  hasPromotionData: boolean;
  executiveCount: number;
  executiveTurnover: boolean;
  transparencyScore: number;
  characterScore: number;
}

function computeDimensions(props: CareerRiskReportProps): RiskDimension[] {
  // 1. Leadership Stability
  let leadership = 30; // baseline
  if (props.executiveCount < 3) leadership += 25;
  if (props.executiveTurnover) leadership += 20;
  if (!props.hasSentimentData) leadership += 10;
  const leadershipLevel = leadership >= 70 ? "High" : leadership >= 45 ? "Medium" : "Low";

  // 2. Layoff History
  let layoff = 20;
  if (props.hasLayoffSignals) layoff += 35;
  if (props.hasWarnNotices) layoff += 25;
  const layoffLevel = layoff >= 70 ? "High" : layoff >= 45 ? "Medium" : "Low";

  // 3. Political Activity
  let political = 15;
  if (props.totalPacSpending > 500000) political += 30;
  else if (props.totalPacSpending > 100000) political += 20;
  else if (props.totalPacSpending > 0) political += 10;
  if (props.lobbyingSpend > 1000000) political += 25;
  else if (props.lobbyingSpend > 100000) political += 15;
  if (props.hasDarkMoney) political += 15;
  const politicalLevel = political >= 70 ? "Elevated" : political >= 45 ? "Medium" : "Low";

  // 4. Promotion Velocity (inverted — low transparency = high risk)
  let promotion = 50; // start uncertain
  if (props.hasPromotionData) promotion -= 25;
  if (props.hasBenefitsData) promotion -= 10;
  if (props.transparencyScore > 60) promotion -= 15;
  else if (props.transparencyScore < 30) promotion += 15;
  const promotionLevel = promotion >= 60 ? "High" : promotion >= 35 ? "Medium" : "Low";

  // 5. Pay vs Industry
  let pay = 45; // uncertain baseline
  if (props.hasPayTransparency) pay -= 20;
  if (props.hasBenefitsData) pay -= 10;
  if (!props.hasPayTransparency && !props.hasBenefitsData) pay += 15;
  const payLevel = pay >= 60 ? "High" : pay >= 35 ? "Medium" : "Low";

  return [
    { label: "Leadership Stability", value: Math.min(100, Math.max(0, leadership)), level: leadershipLevel },
    { label: "Layoff History", value: Math.min(100, Math.max(0, layoff)), level: layoffLevel },
    { label: "Political Activity", value: Math.min(100, Math.max(0, political)), level: politicalLevel as any },
    { label: "Promotion Velocity", value: Math.min(100, Math.max(0, promotion)), level: promotionLevel },
    { label: "Pay vs Industry", value: Math.min(100, Math.max(0, pay)), level: payLevel },
  ];
}

function computeOverallScore(dimensions: RiskDimension[]): number {
  const weights = [0.2, 0.25, 0.15, 0.2, 0.2];
  const weighted = dimensions.reduce((sum, d, i) => sum + d.value * weights[i], 0);
  return Math.round(weighted);
}

function riskColor(level: string) {
  switch (level) {
    case "Low": return { text: "text-[hsl(var(--civic-green))]", bg: "bg-[hsl(var(--civic-green))]", bgLight: "bg-[hsl(var(--civic-green))]/10" };
    case "Medium": return { text: "text-[hsl(var(--civic-yellow))]", bg: "bg-[hsl(var(--civic-yellow))]", bgLight: "bg-[hsl(var(--civic-yellow))]/10" };
    case "High":
    case "Elevated": return { text: "text-[hsl(var(--civic-red))]", bg: "bg-[hsl(var(--civic-red))]", bgLight: "bg-[hsl(var(--civic-red))]/10" };
    default: return { text: "text-muted-foreground", bg: "bg-muted", bgLight: "bg-muted/10" };
  }
}

function overallLabel(score: number) {
  if (score >= 70) return { label: "High Risk", color: "text-[hsl(var(--civic-red))]", ring: "stroke-[hsl(var(--civic-red))]" };
  if (score >= 45) return { label: "Moderate Risk", color: "text-[hsl(var(--civic-yellow))]", ring: "stroke-[hsl(var(--civic-yellow))]" };
  return { label: "Lower Risk", color: "text-[hsl(var(--civic-green))]", ring: "stroke-[hsl(var(--civic-green))]" };
}

const dimensionIcons = [Shield, TrendingDown, Landmark, Zap, DollarSign];

/* ─── The Visual Card (screenshot target) ─── */

function RiskReportCanvas({
  companyName,
  dimensions,
  overallScore,
}: {
  companyName: string;
  dimensions: RiskDimension[];
  overallScore: number;
}) {
  const overall = overallLabel(overallScore);
  const pct = overallScore / 100;

  return (
    <div
      id="career-risk-render"
      className="w-[520px] p-8 rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
      }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-primary" />
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-primary font-semibold">
            Career Risk Report
          </span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-6 tracking-tight">
          {companyName}
        </h2>

        {/* Score + Dimensions */}
        <div className="flex gap-8 items-start">
          {/* Radial score */}
          <div className="text-center shrink-0">
            <svg width={110} height={110} viewBox="0 0 110 110">
              <circle
                cx={55} cy={55} r={46}
                fill="none"
                className="stroke-muted"
                strokeWidth={7}
              />
              <circle
                cx={55} cy={55} r={46}
                fill="none"
                className={overall.ring}
                strokeWidth={7}
                strokeDasharray={`${pct * 289} 289`}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
              />
              <text x={55} y={50} textAnchor="middle" className="fill-foreground text-2xl font-bold" fontSize={26} fontWeight={700}>
                {overallScore}
              </text>
              <text x={55} y={67} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
                / 100
              </text>
            </svg>
            <div className={cn("mt-1 font-mono text-[10px] tracking-wider uppercase font-semibold", overall.color)}>
              {overall.label}
            </div>
          </div>

          {/* Dimension bars */}
          <div className="flex-1 space-y-3">
            {dimensions.map((d, i) => {
              const colors = riskColor(d.level);
              const Icon = dimensionIcons[i];
              return (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">
                        {d.label}
                      </span>
                    </div>
                    <span className={cn("font-mono text-[9px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded", colors.text, colors.bgLight)}>
                      {d.level}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", colors.bg)}
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
            whodoimworkfor.com
          </span>
          <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground">
            Employer Intelligence by Jackye Clayton
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Preview (in-page card) ─── */

function RiskDimensionRow({ dimension, icon: Icon }: { dimension: RiskDimension; icon: typeof Shield }) {
  const colors = riskColor(dimension.level);
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", colors.bgLight)}>
        <Icon className={cn("w-3.5 h-3.5", colors.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-foreground">{dimension.label}</span>
          <span className={cn("text-[10px] font-semibold font-mono tracking-wider uppercase", colors.text)}>
            {dimension.level}
          </span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${dimension.value}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */

export function CareerRiskReport(props: CareerRiskReportProps) {
  const [copied, setCopied] = useState(false);
  const dimensions = computeDimensions(props);
  const overallScore = computeOverallScore(dimensions);
  const overall = overallLabel(overallScore);

  const shareUrl = `https://wdiwf.jackyeclayton.com/company/${props.slug}`;
  const shareText = `${props.companyName} has a Career Risk Score of ${overallScore}/100. Check your employer before you say yes:`;

  // Pre-generate OG card for social sharing
  useEffect(() => {
    preGenerateOGCard({
      type: "career-risk",
      companyA: props.companyName,
      scoreA: overallScore,
      dimensions: dimensions.map(d => ({ label: d.label, score: d.value })),
    });
  }, [props.companyName, overallScore]);

  const generateImage = async (): Promise<HTMLCanvasElement | null> => {
    const el = document.getElementById("career-risk-render");
    if (!el) return null;
    return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${props.companyName.toLowerCase().replace(/\s+/g, "-")}-career-risk.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Career Risk Report downloaded" });
  };

  const handleCopy = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Career Risk Report copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Try downloading instead.", variant: "destructive" });
    }
  };

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=600,height=500");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied — share it!" });
  };

  return (
    <Card className="overflow-hidden">
      {/* Top accent based on risk level */}
      <div className={cn(
        "h-1",
        overallScore >= 70 ? "bg-[hsl(var(--civic-red))]" :
        overallScore >= 45 ? "bg-[hsl(var(--civic-yellow))]" :
        "bg-[hsl(var(--civic-green))]"
      )} />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center border border-primary/10">
              <AlertTriangle className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Career Risk Report</h3>
              <p className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">Before you say yes</p>
            </div>
          </div>

          {/* Big score pill */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            overallScore >= 70 ? "bg-[hsl(var(--civic-red))]/10 border-[hsl(var(--civic-red))]/30" :
            overallScore >= 45 ? "bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/30" :
            "bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/30"
          )}>
            <span className="text-xl font-bold text-foreground font-data">{overallScore}</span>
            <div className="text-left">
              <div className="text-[9px] text-muted-foreground font-mono">/100</div>
              <div className={cn("text-[9px] font-semibold font-mono tracking-wider uppercase", overall.color)}>
                {overall.label}
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2.5 mb-4">
          {dimensions.map((d, i) => (
            <RiskDimensionRow key={d.label} dimension={d} icon={dimensionIcons[i]} />
          ))}
        </div>

        {/* Share row */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Share2 className="w-3.5 h-3.5" />
                Share Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[580px]">
              <DialogHeader>
                <DialogTitle>Career Risk Report — {props.companyName}</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto flex justify-center">
                <RiskReportCanvas
                  companyName={props.companyName}
                  dimensions={dimensions}
                  overallScore={overallScore}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Image"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Download PNG
                </Button>
                <Button size="sm" onClick={shareLinkedIn} className="gap-1.5 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white">
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5 text-xs text-muted-foreground">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            Copy Link
          </Button>

          <span className="ml-auto text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
            Screenshot & share
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
