import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, DollarSign, Link2, Info, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/data/sampleData";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ConfidenceBadge";

export interface DarkMoneyEntity {
  id?: string;
  name: string;
  org_type: string;
  relationship: string;
  estimated_amount?: number | null;
  description?: string | null;
  source?: string | null;
  confidence?: string | null;
}

interface Props {
  entity: DarkMoneyEntity | null;
  companyName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORG_TYPE_CONTEXT: Record<string, string> = {
  "501(c)(4)":
    "This type of organization can engage in political activity without disclosing its donors. Spending through this channel is difficult to trace back to specific individuals or corporations.",
  "501(c)(6)":
    "A trade association that lobbies on behalf of industry members. Dues-paying companies fund its activity, but individual contributions are not publicly disclosed.",
  PAC: "A political action committee that pools contributions from members and donates to candidates or causes. PAC donors are disclosed to the FEC.",
  "Super PAC":
    "Can raise unlimited funds from corporations, unions, and individuals but must disclose donors. Cannot coordinate directly with candidates.",
  nonprofit:
    "A nonprofit organization that may engage in advocacy, education, or lobbying. Donor disclosure requirements vary by tax-exempt status.",
  "527":
    "A tax-exempt organization created to influence elections. Must report contributions and expenditures to the IRS, but is not subject to FEC contribution limits.",
};

function getOrgContext(orgType: string): string {
  const key = Object.keys(ORG_TYPE_CONTEXT).find(
    (k) => k.toLowerCase() === orgType.toLowerCase()
  );
  return key
    ? ORG_TYPE_CONTEXT[key]
    : "An organization connected to corporate political activity. Its structure and disclosure obligations depend on its legal classification.";
}

function mapConfidence(raw?: string | null): ConfidenceLevel {
  if (!raw) return "low";
  const l = raw.toLowerCase();
  if (l === "high" || l === "documented") return "high";
  if (l === "medium" || l === "likely") return "medium";
  return "low";
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Documented",
  medium: "Likely",
  low: "Inferred",
};

export function EntityDetailDrawer({ entity, companyName, open, onOpenChange }: Props) {
  if (!entity) return null;

  const confidence = mapConfidence(entity.confidence);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <DrawerTitle className="text-lg">{entity.name}</DrawerTitle>
            <Badge variant="outline" className="text-xs">
              {entity.org_type}
            </Badge>
          </div>
          <DrawerDescription className="sr-only">
            Details about {entity.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Relationship */}
          <section className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Relationship{companyName ? ` to ${companyName}` : ""}
            </h4>
            <p className="text-sm text-foreground">{entity.relationship}</p>
          </section>

          {/* Amount */}
          {entity.estimated_amount != null && entity.estimated_amount > 0 && (
            <section className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Estimated Amount
              </h4>
              <p className="text-sm font-mono font-semibold text-foreground">
                {formatCurrency(entity.estimated_amount)}
              </p>
            </section>
          )}

          {/* Description */}
          {entity.description && (
            <section className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Details
              </h4>
              <p className="text-sm text-foreground">{entity.description}</p>
            </section>
          )}

          {/* Context */}
          <section className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
              What is a {entity.org_type}?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {getOrgContext(entity.org_type)}
            </p>
          </section>

          {/* Confidence */}
          <section className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Data confidence:</span>
            <ConfidenceBadge
              level={confidence}
              label={CONFIDENCE_LABELS[confidence]}
            />
          </section>

          {/* Source */}
          <section className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground">Source</h4>
            {entity.source ? (
              <a
                href={entity.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View source <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No public source linked for this connection.
              </p>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
