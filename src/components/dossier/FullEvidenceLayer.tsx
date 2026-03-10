import { useState } from "react";
import { FileText, ExternalLink, DollarSign, Megaphone, Landmark, Lightbulb, Network, Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EvidenceItem {
  label: string;
  detail?: string;
  sourceUrl?: string;
  sourceType: string;
  date?: string;
}

interface FullEvidenceProps {
  campaignFinance: EvidenceItem[];
  lobbying: EvidenceItem[];
  contracts: EvidenceItem[];
  patents: EvidenceItem[];
  subcontractors: EvidenceItem[];
  websiteChanges: EvidenceItem[];
  publicStatements: EvidenceItem[];
  humanCapital: EvidenceItem[];
}

const TABS = [
  { key: "campaignFinance", label: "Campaign Finance", icon: DollarSign },
  { key: "lobbying", label: "Lobbying", icon: Megaphone },
  { key: "contracts", label: "Contracts", icon: Landmark },
  { key: "patents", label: "Patents", icon: Lightbulb },
  { key: "subcontractors", label: "Ecosystem", icon: Network },
  { key: "websiteChanges", label: "Website Changes", icon: Globe },
  { key: "publicStatements", label: "Statements", icon: FileText },
  { key: "humanCapital", label: "Human Capital", icon: Users },
] as const;

export function FullEvidenceLayer(props: FullEvidenceProps) {
  const [activeTab, setActiveTab] = useState<string>("campaignFinance");
  const items = props[activeTab as keyof FullEvidenceProps] || [];

  const nonEmptyTabs = TABS.filter(t => (props[t.key as keyof FullEvidenceProps] || []).length > 0);

  if (nonEmptyTabs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-caption text-muted-foreground">No evidence records available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-border/30 pb-2">
        {TABS.map(tab => {
          const count = (props[tab.key as keyof FullEvidenceProps] || []).length;
          if (count === 0) return null;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 text-micro px-3 py-1.5 rounded-lg transition-colors",
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
              <span className="font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/20">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground text-caption">{item.label}</span>
              {item.detail && <p className="text-micro text-muted-foreground mt-0.5">{item.detail}</p>}
              {item.date && <span className="text-micro text-muted-foreground">{item.date}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-micro">{item.sourceType}</Badge>
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
