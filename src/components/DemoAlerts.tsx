import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEMO_ALERTS = [
  {
    id: "demo-1",
    company_name: "MAC Cosmetics",
    signal_category: "Safety Alert",
    change_type: "new_signal",
    change_description: "NEW SAFETY SIGNAL — OSHA complaint filed at distribution facility. Complaint alleges inadequate ventilation and chemical exposure protocols at New Jersey distribution center.",
    date_detected: "2026-01-15T14:30:00Z",
    is_read: false,
  },
  {
    id: "demo-2",
    company_name: "Nike",
    signal_category: "Labor Impact",
    change_type: "new_signal",
    change_description: "LABOR SIGNAL — WARN Act notice filed, Beaverton OR, 340 employees. Restructuring tied to direct-to-consumer shift and regional warehouse consolidation.",
    date_detected: "2026-02-03T10:15:00Z",
    is_read: false,
  },
  {
    id: "demo-3",
    company_name: "Nike",
    signal_category: "Connected Dots",
    change_type: "changed",
    change_description: "INTEGRITY SIGNAL — Lobbying spend increased 34% vs prior year. Nike's federal lobbying expenditures rose from $2.1M to $2.8M, with new filings targeting trade policy and supply chain regulation.",
    date_detected: "2026-03-01T09:00:00Z",
    is_read: true,
  },
];

export function DemoAlerts() {
  const grouped = DEMO_ALERTS.reduce<Record<string, typeof DEMO_ALERTS>>((acc, alert) => {
    const date = new Date(alert.date_detected).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(alert);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-[10px]">Demo Data</Badge>
        <span className="text-[10px] text-muted-foreground">Sample alerts for demonstration purposes</span>
      </div>
      {Object.entries(grouped).map(([date, dateAlerts]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2 relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border hidden sm:block" />
            {dateAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  !alert.is_read ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                )}
              >
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 hidden sm:block",
                  !alert.is_read ? "bg-primary" : "bg-border"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{alert.company_name}</span>
                    <Badge variant="outline" className="text-[10px]">{alert.signal_category}</Badge>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      alert.change_type === "new_signal" && "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]",
                      alert.change_type === "changed" && "border-amber-500/30 text-amber-500",
                    )}>{alert.change_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.change_description}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {new Date(alert.date_detected).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
