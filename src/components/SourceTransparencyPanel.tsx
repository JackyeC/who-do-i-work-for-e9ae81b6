/**
 * Source Transparency Panel
 * Clickable overlay showing full verification chain for any signal.
 * Displays: identity verification, claim sources, freshness, evidence links.
 */

import { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, Clock, ExternalLink, FileSearch, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface VerificationSource {
  source?: string;
  type?: string;
  url?: string;
  status?: string;
  details?: string;
  excerpt?: string;
  field?: string;
}

export interface VerificationData {
  identity_verified?: boolean;
  identity_sources?: VerificationSource[];
  claim_verified?: boolean;
  claim_sources?: VerificationSource[];
  claim_evidence_urls?: string[];
  freshness_status?: string;
  data_last_updated?: string;
  verification_status?: string;
  confidence_level?: string;
  verified_by?: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Shield; label: string; className: string }> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    className: "text-[hsl(var(--civic-green))] bg-[hsl(var(--civic-green))]/10 border-[hsl(var(--civic-green))]/20",
  },
  partially_verified: {
    icon: Shield,
    label: "Partially Verified",
    className: "text-[hsl(var(--civic-yellow))] bg-[hsl(var(--civic-yellow))]/10 border-[hsl(var(--civic-yellow))]/20",
  },
  unverified: {
    icon: ShieldAlert,
    label: "Unverified",
    className: "text-muted-foreground bg-muted/50 border-border",
  },
  disputed: {
    icon: ShieldAlert,
    label: "Disputed",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
  suppressed: {
    icon: ShieldAlert,
    label: "Suppressed",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
};

const FRESHNESS_LABELS: Record<string, { label: string; className: string }> = {
  fresh: { label: "Current (< 30 days)", className: "text-[hsl(var(--civic-green))]" },
  aging: { label: "Aging (30–90 days)", className: "text-[hsl(var(--civic-yellow))]" },
  stale: { label: "Stale (> 90 days)", className: "text-destructive" },
  unknown: { label: "Unknown", className: "text-muted-foreground" },
};

interface SourceTransparencyPanelProps {
  verification: VerificationData;
  compact?: boolean;
  className?: string;
}

export function SourceTransparencyPanel({ verification, compact = false, className }: SourceTransparencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const status = STATUS_CONFIG[verification.verification_status || "unverified"] || STATUS_CONFIG.unverified;
  const freshness = FRESHNESS_LABELS[verification.freshness_status || "unknown"] || FRESHNESS_LABELS.unknown;
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <Badge variant="outline" className={cn("text-[9px] gap-1", status.className)}>
        <StatusIcon className="w-2.5 h-2.5" />
        {status.label}
      </Badge>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors text-left",
            status.className,
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              {status.label}
            </span>
            {verification.confidence_level && (
              <span className="text-[9px] opacity-70">
                · {verification.confidence_level} confidence
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-3 p-3 rounded-lg bg-muted/30 border border-border/30">
          {/* Layer 1: Identity */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                Layer 1 — Identity Verification
              </span>
              <Badge variant="outline" className={cn("text-[8px] ml-auto", verification.identity_verified ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" : "text-muted-foreground border-border")}>
                {verification.identity_verified ? "Confirmed" : "Unconfirmed"}
              </Badge>
            </div>
            {verification.identity_sources && verification.identity_sources.length > 0 && (
              <div className="space-y-1 ml-4">
                {verification.identity_sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="font-medium">{src.source?.replace(/_/g, " ")}</span>
                    {src.status && <span className="opacity-60">({src.status})</span>}
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-auto">
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Layer 2: Claim */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileSearch className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                Layer 2 — Claim Verification
              </span>
              <Badge variant="outline" className={cn("text-[8px] ml-auto", verification.claim_verified ? "text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30" : "text-muted-foreground border-border")}>
                {verification.claim_verified ? "Sourced" : "Unsourced"}
              </Badge>
            </div>
            {verification.claim_sources && verification.claim_sources.length > 0 && (
              <div className="space-y-1 ml-4">
                {verification.claim_sources.map((src, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="font-medium">{src.type?.replace(/_/g, " ")}</span>
                    {src.source && <span>— {src.source}</span>}
                    {src.status && <span className="opacity-60">({src.status})</span>}
                    {src.url && (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-auto">
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            {verification.claim_evidence_urls && verification.claim_evidence_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-4 mt-1">
                {verification.claim_evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-mono"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Primary Source {verification.claim_evidence_urls!.length > 1 ? i + 1 : ""}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Layer 3: Freshness */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                Layer 3 — Data Freshness
              </span>
              <span className={cn("text-[9px] font-medium ml-auto", freshness.className)}>
                {freshness.label}
              </span>
            </div>
            {verification.data_last_updated && (
              <p className="text-[10px] text-muted-foreground ml-4">
                Last updated: {new Date(verification.data_last_updated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
              Verified by: {verification.verified_by || "system"} · 
              {verification.updated_at && ` Last check: ${new Date(verification.updated_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Inline verification badge — minimal version for signal card headers */
export function VerificationBadge({ status, confidence }: { status?: string; confidence?: string }) {
  const config = STATUS_CONFIG[status || "unverified"] || STATUS_CONFIG.unverified;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border", config.className)}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}
