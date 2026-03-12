import { useState } from "react";
import { ExternalLink, Shield, Info, FileText, Camera, MessageSquare, Globe, ChevronDown, ChevronUp, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_CONFIG } from "@/lib/valuesLenses";
import { cn } from "@/lib/utils";

interface EvidenceRecord {
  id: string;
  signal_type: string;
  source_name?: string;
  source_type?: string;
  source_url?: string;
  source_title?: string;
  evidence_summary?: string;
  evidence_excerpt?: string;
  evidence_screenshot_url?: string;
  evidence_image_urls?: string[];
  related_legislation?: string;
  related_org?: string;
  related_politician?: string;
  amount?: number;
  event_date?: string;
  confidence_level: string;
  verification_status: string;
}

interface Props {
  evidence: EvidenceRecord;
}

const SOURCE_TYPE_META: Record<string, { icon: any; label: string; accent: string }> = {
  lobbying_filing: { icon: FileText, label: "Lobbying Filing", accent: "border-blue-500/40 bg-blue-500/5" },
  pac_donation: { icon: FileText, label: "PAC Donation Record", accent: "border-purple-500/40 bg-purple-500/5" },
  executive_donation: { icon: FileText, label: "Executive Donation", accent: "border-indigo-500/40 bg-indigo-500/5" },
  sec_filing: { icon: FileText, label: "SEC Filing", accent: "border-amber-500/40 bg-amber-500/5" },
  government_contract: { icon: FileText, label: "Federal Contract", accent: "border-emerald-500/40 bg-emerald-500/5" },
  enforcement_action: { icon: Shield, label: "Enforcement Action", accent: "border-red-500/40 bg-red-500/5" },
  corporate_statement: { icon: MessageSquare, label: "Corporate Statement", accent: "border-sky-500/40 bg-sky-500/5" },
  advocacy_alignment: { icon: Globe, label: "Advocacy Link", accent: "border-orange-500/40 bg-orange-500/5" },
  social_media: { icon: MessageSquare, label: "Social Post", accent: "border-pink-500/40 bg-pink-500/5" },
  news_article: { icon: Globe, label: "News Coverage", accent: "border-cyan-500/40 bg-cyan-500/5" },
};

export function ValuesEvidenceCard({ evidence }: Props) {
  const [expanded, setExpanded] = useState(false);
  const conf = CONFIDENCE_CONFIG[evidence.confidence_level] || CONFIDENCE_CONFIG.medium;
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const meta = SOURCE_TYPE_META[evidence.source_type || ""] || {
    icon: FileText,
    label: evidence.source_type?.replace(/_/g, " ") || "Record",
    accent: "border-border/50 bg-muted/20",
  };
  const SourceIcon = meta.icon;
  const hasImages = !!(evidence.evidence_screenshot_url || (evidence.evidence_image_urls && evidence.evidence_image_urls.length > 0));

  return (
    <div className={cn("rounded-xl border overflow-hidden transition-all", meta.accent)}>
      {/* ─── Screenshot / Document Preview ─── */}
      {evidence.evidence_screenshot_url && (
        <div className="relative bg-muted/50">
          <img
            src={evidence.evidence_screenshot_url}
            alt="Evidence screenshot"
            className="w-full h-40 object-cover object-top"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <Badge className="absolute top-2 left-2 text-[9px] gap-1 bg-background/80 backdrop-blur-sm text-foreground border-none">
            <Camera className="w-2.5 h-2.5" />
            Document Screenshot
          </Badge>
        </div>
      )}

      {/* ─── Image Gallery (tweets, filings, photos) ─── */}
      {evidence.evidence_image_urls && evidence.evidence_image_urls.length > 0 && !evidence.evidence_screenshot_url && (
        <div className={cn(
          "grid gap-1 bg-muted/30",
          evidence.evidence_image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {evidence.evidence_image_urls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative aspect-video">
              <img
                src={url}
                alt={`Evidence ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* ─── Content ─── */}
      <div className="p-4 space-y-2.5">
        {/* Source type header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SourceIcon className={cn("w-4 h-4", conf.color || "text-muted-foreground")} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${conf.color}`}>
              {conf.plainLabel}
            </Badge>
            {evidence.event_date && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(evidence.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Main summary — the "headline" */}
        <p className="text-sm text-foreground font-semibold leading-snug">
          {evidence.evidence_summary || evidence.signal_type.replace(/_/g, " ")}
        </p>

        {/* Dollar amount callout */}
        {evidence.amount && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <span className="text-lg font-bold text-primary font-mono">
              {formatCurrency(evidence.amount)}
            </span>
            <span className="text-[10px] text-muted-foreground">reported amount</span>
          </div>
        )}

        {/* Direct quote / excerpt */}
        {evidence.evidence_excerpt && (
          <blockquote className="border-l-2 border-primary/40 pl-3 py-1">
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              "{evidence.evidence_excerpt}"
            </p>
          </blockquote>
        )}

        {/* Related entities */}
        {(evidence.related_legislation || evidence.related_org || evidence.related_politician) && (
          <div className="flex flex-wrap gap-1.5">
            {evidence.related_legislation && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Scale className="w-2.5 h-2.5" />
                {evidence.related_legislation}
              </Badge>
            )}
            {evidence.related_politician && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Info className="w-2.5 h-2.5" />
                {evidence.related_politician}
              </Badge>
            )}
            {evidence.related_org && (
              <Badge variant="outline" className="text-[10px]">
                {evidence.related_org}
              </Badge>
            )}
          </div>
        )}

        {/* Source link — prominent "View Original Record" CTA */}
        {evidence.source_url && (
          <a
            href={evidence.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {evidence.source_name || "View Original Record"}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">{evidence.source_url}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
