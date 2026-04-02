import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingDown, Landmark, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotData {
  workerSummary: string;
  stabilitySummary: string;
  moneySummary: string;
  leadershipSummary: string;
}

interface Props {
  data: SnapshotData;
}

const CARDS = [
  {
    key: "workerSummary" as const,
    label: "How they treat workers",
    Icon: Users,
    anchor: "workforce-signals",
  },
  {
    key: "stabilitySummary" as const,
    label: "Stability & layoffs",
    Icon: TrendingDown,
    anchor: "warn-filings",
  },
  {
    key: "moneySummary" as const,
    label: "Money & influence",
    Icon: Landmark,
    anchor: "political-giving",
  },
  {
    key: "leadershipSummary" as const,
    label: "Leadership pattern",
    Icon: UserCheck,
    anchor: "leadership-signals",
  },
];

/**
 * 4 quick-read snapshot cards that summarize the dossier's key areas.
 * Each links to the deeper section below.
 */
export function DossierSnapshotCards({ data }: Props) {
  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
      {CARDS.map(({ key, label, Icon, anchor }) => (
        <Card
          key={key}
          className="cursor-pointer hover:shadow-sm transition-all hover:border-primary/30 group"
          onClick={() => scrollTo(anchor)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/5 shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data[key]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
