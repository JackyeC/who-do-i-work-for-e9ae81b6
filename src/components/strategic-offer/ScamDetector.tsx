import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertOctagon, CheckCircle2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScamSignal {
  id: string;
  detected: boolean;
  label: string;
  description: string;
}

interface Props {
  additionalDetails: string;
  hasInterview: boolean;
  asksToBuyEquipment: boolean;
}

export function ScamDetector({ additionalDetails, hasInterview, asksToBuyEquipment }: Props) {
  const text = additionalDetails.toLowerCase();

  const signals: ScamSignal[] = [
    {
      id: "no-interview",
      detected: !hasInterview || text.includes("no interview") || text.includes("without interview"),
      label: "No Interview Process",
      description: "Legitimate employers always conduct interviews. An offer without any interview process is a major red flag for employment scams.",
    },
    {
      id: "buy-equipment",
      detected: asksToBuyEquipment || text.includes("buy equipment") || text.includes("purchase equipment") || text.includes("send check") || text.includes("cashier") || text.includes("money order"),
      label: "Equipment Purchase via Check",
      description: "If the employer asks you to buy equipment with a check they send you, this is a classic advance-fee scam. The check will bounce and you'll be out the money.",
    },
    {
      id: "upfront-payment",
      detected: text.includes("training fee") || text.includes("background check fee") || text.includes("processing fee") || text.includes("pay upfront"),
      label: "Upfront Payment Required",
      description: "Legitimate employers never ask candidates to pay for training, background checks, or processing. This is a hallmark of employment fraud.",
    },
    {
      id: "personal-banking",
      detected: text.includes("bank account") || text.includes("routing number") || text.includes("direct deposit form") && text.includes("before"),
      label: "Early Banking Info Request",
      description: "Requesting banking information before official hiring paperwork is complete is suspicious. Standard onboarding handles this through secure HR systems.",
    },
    {
      id: "too-good",
      detected: text.includes("guaranteed income") || text.includes("unlimited earning") || text.includes("no experience needed") || text.includes("make money fast"),
      label: "Unrealistic Promises",
      description: "'Guaranteed income' or 'unlimited earning potential' with no experience required are classic bait phrases used in MLM schemes and scam offers.",
    },
  ];

  const detectedScams = signals.filter(s => s.detected);
  const isHighAlert = detectedScams.length >= 2;

  if (detectedScams.length === 0) return null;

  return (
    <div className="space-y-4">
      {isHighAlert && (
        <Card className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 overflow-hidden">
          <CardContent className="p-6 text-center space-y-3">
            <AlertOctagon className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-display font-bold text-destructive">
              ⚠️ High-Alert Scam Warning
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Multiple scam indicators detected in this offer. <span className="font-semibold text-foreground">Do not share personal information or send money.</span> Legitimate employers never require upfront payments or skip interviews.
            </p>
            <Badge variant="destructive" className="text-xs">
              {detectedScams.length} scam indicators detected
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {signals.map(signal => (
          <div
            key={signal.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-colors",
              signal.detected
                ? "bg-destructive/5 border-destructive/20"
                : "bg-muted/30 border-border/40"
            )}
          >
            {signal.detected ? (
              <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-civic-green mt-0.5 shrink-0" />
            )}
            <div>
              <p className={cn("text-sm font-medium", signal.detected ? "text-destructive" : "text-muted-foreground")}>
                {signal.label}
              </p>
              {signal.detected && (
                <p className="text-xs text-muted-foreground mt-0.5">{signal.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
