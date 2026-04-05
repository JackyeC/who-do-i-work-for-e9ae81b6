import { Crown } from "lucide-react";

export function EditorsNote() {
  return (
    <div className="rounded-xl border p-6 mb-8" style={{ background: "hsl(var(--primary) / 0.03)", borderColor: "hsl(var(--primary) / 0.15)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-bold text-primary tracking-[0.15em] uppercase font-mono">Editor's Note</span>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        Every story here has a labor signal underneath it. I'm not summarizing the news.
        I'm telling you what it means for your career, your paycheck, and your leverage.
        The receipts are linked. The take is mine.
      </p>
      <p className="text-xs text-muted-foreground mt-3 font-mono tracking-wide">
        — Jackye Clayton, WDIWF
      </p>
    </div>
  );
}
