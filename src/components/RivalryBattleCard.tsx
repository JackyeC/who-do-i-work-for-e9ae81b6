import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, MapPin, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Rivalry } from "@/data/rivalries2026";

interface RivalryBattleCardProps {
  rivalry: Rivalry;
  compact?: boolean;
}

function TrustBadge({ rating }: { rating?: string }) {
  if (!rating) return null;
  const color = rating.startsWith("A")
    ? "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20"
    : rating.startsWith("B")
    ? "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/20"
    : "text-destructive bg-destructive/10 border-destructive/20";
  return (
    <span className={cn("font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 border", color)}>
      {rating}
    </span>
  );
}

export function RivalryBattleCard({ rivalry, compact }: RivalryBattleCardProps) {
  return (
    <div className="border border-border bg-card hover:border-primary/30 transition-all group">
      {/* Category strip */}
      <div className="px-4 py-2 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{rivalry.categoryIcon}</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
            {rivalry.title}
          </span>
        </div>
        {rivalry.geoTag && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
            <MapPin className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{rivalry.geoTag.split("—")[0].trim()}</span>
          </div>
        )}
      </div>

      {/* VS Battle */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Company A */}
        <Link
          to={`/company/${rivalry.companyA.slug}`}
          className="p-4 hover:bg-primary/[0.03] transition-colors text-center"
        >
          <div className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
            {rivalry.companyA.name}
          </div>
          <div className="text-xl font-black text-primary tabular-nums leading-none mb-0.5">
            {rivalry.companyA.stat}
          </div>
          <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
            {rivalry.companyA.statLabel}
          </div>
          {rivalry.trustSignalA && (
            <div className="mt-2 flex justify-center">
              <TrustBadge rating={rivalry.trustSignalA} />
            </div>
          )}
        </Link>

        {/* VS Divider */}
        <div className="flex flex-col items-center px-2">
          <div className="w-px h-6 bg-border" />
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="w-px h-6 bg-border" />
        </div>

        {/* Company B */}
        <Link
          to={`/company/${rivalry.companyB.slug}`}
          className="p-4 hover:bg-primary/[0.03] transition-colors text-center"
        >
          <div className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
            {rivalry.companyB.name}
          </div>
          <div className="text-xl font-black text-primary tabular-nums leading-none mb-0.5">
            {rivalry.companyB.stat}
          </div>
          <div className="font-mono text-[8px] tracking-wider uppercase text-muted-foreground">
            {rivalry.companyB.statLabel}
          </div>
          {rivalry.trustSignalB && (
            <div className="mt-2 flex justify-center">
              <TrustBadge rating={rivalry.trustSignalB} />
            </div>
          )}
        </Link>
      </div>

      {!compact && (
        <>
          {/* 2026 Signal */}
          <div className="px-4 py-3 border-t border-border bg-muted/10">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary font-semibold">
                2026 Signal
              </span>
            </div>
            <p className="text-[12px] text-foreground/80 leading-relaxed">{rivalry.signal2026}</p>
          </div>

          {/* Verdict */}
          <div className="px-4 py-3 border-t border-border">
            <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
              The Verdict
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{rivalry.verdict}</p>
          </div>

          {/* Geo Tag */}
          {rivalry.geoTag && (
            <div className="px-4 py-2 border-t border-border bg-muted/5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{rivalry.geoTag}</span>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
        <div className="flex gap-2">
          <Link
            to={`/company/${rivalry.companyA.slug}`}
            className="font-mono text-[9px] tracking-wider uppercase text-primary hover:underline"
          >
            {rivalry.companyA.name} Intel →
          </Link>
          <span className="text-border">|</span>
          <Link
            to={`/company/${rivalry.companyB.slug}`}
            className="font-mono text-[9px] tracking-wider uppercase text-primary hover:underline"
          >
            {rivalry.companyB.name} Intel →
          </Link>
        </div>
        <Link
          to={`/compare?a=${rivalry.companyA.slug}&b=${rivalry.companyB.slug}`}
          className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Compare <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}
