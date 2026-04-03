import { Eye, CheckCircle2, MessageSquare, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface HardInterviewQuestionsProps {
  companyName: string;
  lobbyingSpend?: number | null;
  eeocCount: number;
}

function fmtMoney(n?: number | null): string {
  if (!n) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function ActionItem({ type, text }: { type: "watch" | "check" | "ask"; text: string }) {
  const config = {
    watch: { icon: Eye, label: "WATCH", color: "text-civic-yellow" },
    check: { icon: CheckCircle2, label: "CHECK", color: "text-civic-blue" },
    ask: { icon: MessageSquare, label: "ASK", color: "text-civic-green" },
  };
  const { icon: Icon, label, color } = config[type];
  return (
    <div className="flex items-start gap-3 p-3 bg-background/40 border border-border/20">
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className={cn("font-mono text-[10px] font-bold tracking-wider", color)}>{label}</span>
      </div>
      <p className="text-sm text-foreground leading-snug">{text}</p>
    </div>
  );
}

export function HardInterviewQuestions({ companyName, lobbyingSpend, eeocCount }: HardInterviewQuestionsProps) {
  return (
    <div className="border-l-4 border-primary/40 bg-primary/5 p-6">
      <div className="flex items-start gap-4 mb-5 pt-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-full border border-primary/30 bg-primary/5 shrink-0">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black tracking-tight text-foreground uppercase">3 Hard Questions for Your Interview</h3>
          <p className="text-xs text-muted-foreground">Ask these to force transparency from the hiring team</p>
        </div>
      </div>
      <div className="pl-11 space-y-3">
        <ActionItem type="ask" text={`"How does leadership communicate major organizational changes before they hit the press?"`} />
        {(lobbyingSpend ?? 0) > 0 ? (
          <ActionItem type="ask" text={`"${companyName} has ${fmtMoney(lobbyingSpend)} in lobbying spend. How does the company's policy work affect the stability of this team?"`} />
        ) : (
          <ActionItem type="ask" text={`"What does stability look like for this team over the next 18 to 24 months?"`} />
        )}
        {eeocCount > 0 ? (
          <ActionItem type="ask" text={`"I noticed ${eeocCount > 1 ? "multiple enforcement actions" : "an enforcement action"} in your company's record. What changed internally as a result?"`} />
        ) : (
          <ActionItem type="ask" text={`"Can you walk me through how this role's KPIs have changed in the last 6 months?"`} />
        )}
      </div>
      <div className="pl-11 mt-4 pt-4 border-t border-border/20 space-y-2">
        <p className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] uppercase mb-2">Also on your radar</p>
        <ActionItem type="watch" text={`Watch for leadership changes at ${companyName} — executive turnover patterns signal strategic instability.`} />
        {(lobbyingSpend ?? 0) > 0 && (
          <ActionItem type="check" text={`Check which policies ${companyName} is lobbying on — ${fmtMoney(lobbyingSpend)} in spend means they are actively shaping the rules.`} />
        )}
      </div>
    </div>
  );
}
