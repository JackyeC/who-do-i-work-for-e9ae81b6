export function FollowTheMoneyTeaser() {
  return (
    <div className="rounded-xl border border-primary/15 bg-card/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/20 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/70">
          Intelligence Module
        </p>
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground tracking-tight">
          Every company in this story has a paper trail.
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The employers behind layoffs, reorgs, and silent policy shifts leave receipts — in federal filings,
          lobbying disclosures, and political contribution records most people never see.
          WDIWF's <span className="text-primary font-medium">Follow The Money</span> feature
          surfaces the financial and political footprint connected to the companies shaping your career.
        </p>
        <p className="text-[11px] text-muted-foreground/50 italic border-l-2 border-primary/20 pl-3">
          This isn't about outrage. It's about seeing the full picture before you sign.
        </p>
      </div>
    </div>
  );
}
