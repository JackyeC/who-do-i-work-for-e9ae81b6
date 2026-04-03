import { useScanUsage } from "@/hooks/use-scan-usage";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";

export function ScanCounter() {
  const { user } = useAuth();
  const { scansRemaining, FREE_SCAN_LIMIT, loading } = useScanUsage();

  // Don't show for logged-in users or while loading
  if (user || loading) return null;

  // Don't show if all scans remaining (hasn't started yet)
  if (scansRemaining === FREE_SCAN_LIMIT) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-border/50 bg-card/50">
      <Shield className="w-3 h-3 text-primary" />
      <span className="font-mono text-[10px] tracking-wider text-foreground/80">
        {scansRemaining > 0
          ? `${scansRemaining} FREE SCANS LEFT`
          : "SIGN UP FOR MORE SCANS"
        }
      </span>
    </div>
  );
}
