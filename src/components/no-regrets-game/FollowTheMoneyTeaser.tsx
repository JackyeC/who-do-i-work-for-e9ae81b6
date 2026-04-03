export function FollowTheMoneyTeaser() {
  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🧾</span>
        <h3 className="text-sm font-display font-bold text-foreground tracking-tight">
          Every company in this story has a paper trail.
        </h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The employers behind layoffs, reorgs, and silent policy shifts leave receipts — in federal filings,
        lobbying disclosures, and political contribution records most people never see.
        WDIWF's <span className="text-primary font-medium">Follow The Money</span> feature
        surfaces the financial and political footprint connected to the companies shaping your career.
      </p>
      <p className="text-[11px] text-muted-foreground/70 italic">
        This isn't about outrage. It's about seeing the full picture before you sign.
      </p>
    </div>
  );
}
