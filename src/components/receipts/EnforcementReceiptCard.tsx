import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink, DollarSign, Calendar, FileText,
  Landmark, Building2, Shield,
} from "lucide-react";

const SOURCE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  campaign_finance: { label: "FEC Filing", icon: DollarSign },
  fec_direct: { label: "FEC Filing", icon: DollarSign },
  congress_legislation: { label: "Congress.gov", icon: Landmark },
  lobbying_disclosure: { label: "Senate LDA", icon: FileText },
  government_contract: { label: "USASpending", icon: Building2 },
  ideology_scan: { label: "Ideology Scan", icon: Shield },
  known_corporate_actions: { label: "Public Record", icon: FileText },
  public_stance_analysis: { label: "Public Stance", icon: FileText },
  company_signal_scan: { label: "Signal Scan", icon: Shield },
  company_profile: { label: "Company Snapshot", icon: Building2 },
  entity_linkage: { label: "Entity Linkage", icon: FileText },
  issue_legislation_map: { label: "Legislation Link", icon: Landmark },
  DOJ: { label: "Dept. of Justice", icon: Landmark },
  SEC: { label: "SEC Filing", icon: FileText },
  "OSHA/WARN": { label: "OSHA / WARN", icon: Shield },
  "AP News/Court Records": { label: "Court Records", icon: FileText },
};

export interface EnforcementSignal {
  id: string;
  entity_id?: string;
  entity_name_snapshot?: string;
  issue_category?: string;
  signal_type?: string;
  signal_subtype?: string;
  source_dataset?: string;
  description?: string;
  source_url?: string;
  confidence_score?: string;
  amount?: number | null;
  transaction_date?: string | null;
  created_at?: string;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

function formatAmount(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface Props {
  signal: EnforcementSignal;
}

export function EnforcementReceiptCard({ signal: s }: Props) {
  const sourceInfo = SOURCE_LABELS[s.source_dataset || ""] || { label: s.source_dataset || "Source", icon: FileText };
  const SourceIcon = sourceInfo.icon;
  const slug = s.entity_name_snapshot ? toSlug(s.entity_name_snapshot) : null;
  const amount = s.amount ? Number(s.amount) : null;

  return (
    <Card className="hover:border-primary/20 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <SourceIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs capitalize">
                {s.issue_category?.replace(/_/g, " ") || "Signal"}
              </Badge>
              <Badge variant="secondary" className="text-xs">{sourceInfo.label}</Badge>
              <Badge
                variant={s.confidence_score === "high" ? "default" : "outline"}
                className="text-xs"
              >
                {s.confidence_score === "high" ? "Strong Evidence" : "Some Evidence"}
              </Badge>
            </div>

            {/* Company name link + description */}
            <p className="text-sm font-medium text-foreground">
              {s.entity_name_snapshot && slug ? (
                <Link
                  to={`/dossier/${slug}`}
                  className="text-primary hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  {s.entity_name_snapshot}
                </Link>
              ) : s.entity_name_snapshot ? (
                <span className="text-primary">{s.entity_name_snapshot}</span>
              ) : null}
              {s.entity_name_snapshot && ": "}
              {s.description}
            </p>

            {/* Amount + View Receipt + Date */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {amount && amount > 0 && (
                <span className="flex items-center gap-1 font-bold text-foreground text-sm">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  {formatAmount(amount)}
                </span>
              )}
              {s.source_url && /^https?:\/\//.test(s.source_url) && (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Receipt
                </a>
              )}
              {(s.transaction_date || s.created_at) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(s.transaction_date || s.created_at!).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
