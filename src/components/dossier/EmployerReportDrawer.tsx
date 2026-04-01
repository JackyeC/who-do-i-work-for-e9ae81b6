import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, DollarSign, Calendar, FileText, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Evidence Row ─── */
export interface EvidenceRecord {
  eventType: string;
  category: string;
  date: string | null;
  amount: number | null;
  description: string;
  sourceUrl: string | null;
  sourceName: string;
}

interface EmployerReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  records: EvidenceRecord[];
  initialCategory?: string | null;
}

const CATEGORY_ORDER = [
  "Political Spending",
  "Lobbying",
  "Government Contracts",
  "Enforcement & EEOC",
  "Issue Signals",
  "Corporate Claims",
  "Workforce",
];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function EvidenceRow({ record }: { record: EvidenceRecord }) {
  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono uppercase tracking-wider shrink-0">
              {record.eventType}
            </Badge>
            {record.date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(record.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{record.description}</p>
        </div>
        {record.amount != null && record.amount > 0 && (
          <span className="text-sm font-bold text-foreground tabular-nums shrink-0 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            {formatCurrency(record.amount)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{record.sourceName}</span>
        {record.sourceUrl && (
          <a
            href={record.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
          >
            View source <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function EmployerReportDrawer({
  open,
  onOpenChange,
  companyName,
  records,
  initialCategory,
}: EmployerReportDrawerProps) {
  // Group records by category, preserving order
  const grouped = CATEGORY_ORDER.reduce<Record<string, EvidenceRecord[]>>((acc, cat) => {
    const items = records.filter((r) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  // Add any categories not in CATEGORY_ORDER
  records.forEach((r) => {
    if (!CATEGORY_ORDER.includes(r.category)) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    }
  });

  const totalRecords = records.length;
  const hasRecords = totalRecords > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-card border-border p-0">
        <div className="p-6 border-b border-border/40">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-black tracking-tight text-foreground">
              <FileText className="inline w-4 h-4 mr-2 text-primary" />
              Full Employer Report
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {companyName} — {totalRecords} itemized record{totalRecords !== 1 ? "s" : ""} from public sources
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-6">
            {!hasRecords ? (
              /* ── Investigation in progress state ── */
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-2">Investigation in Progress</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-1">
                  We're still pulling the receipts on {companyName}. Public records are being indexed and structured.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Check back soon for updates</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category} id={`report-${category.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold">
                        {category}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="border border-border/40 rounded-lg overflow-hidden bg-background/50">
                      <div className="px-3">
                        {items.map((record, i) => (
                          <EvidenceRow key={i} record={record} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50 font-mono text-center uppercase tracking-wider mt-8">
              Public records · Verify at source
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
