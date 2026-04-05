import { format } from "date-fns";
import { Radio } from "lucide-react";

function getEditionName(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function WireEditionHeader({ storyCount }: { storyCount: number }) {
  const edition = getEditionName();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Radio className="w-4 h-4 text-destructive animate-pulse" />
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">
            The Wire{" "}
            <span className="text-primary">· {edition} Edition</span>
          </h2>
          <p className="text-[13px] text-muted-foreground font-mono tracking-wider">{today}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground/60 font-mono tracking-wider">
        {storyCount} signal{storyCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
