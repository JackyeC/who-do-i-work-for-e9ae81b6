import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommitHorizontal } from "lucide-react";
import { format } from "date-fns";

interface TimelineProps {
  application: {
    status: string;
    created_at: string | null;
    applied_at: string | null;
    updated_at: string | null;
  };
}

export function ApplicationTimeline({ application }: TimelineProps) {
  const events = [
    { label: "Application created", date: application.created_at, always: true },
    { label: "Submitted", date: application.applied_at, always: false },
    {
      label: `Status: ${application.status}`,
      date: application.updated_at,
      always: application.status !== "Draft" && application.status !== "Submitted",
    },
  ].filter(e => e.always || e.date);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitCommitHorizontal className="w-4 h-4" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 space-y-4">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-border" />

          {events.map((event, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className="absolute left-[-15px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10" />
              <div>
                <p className="text-sm font-medium text-foreground">{event.label}</p>
                {event.date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
