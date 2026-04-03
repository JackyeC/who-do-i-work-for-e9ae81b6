import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplyDrawer } from "@/components/applications/ApplyDrawer";

interface ApplyWithWDIWFProps {
  companyId: string;
  companyName: string;
  companySlug?: string;
  alignmentScore?: number;
  matchedSignals?: string[];
  civicScore?: number;
  hasLayoffs?: boolean;
  hasEEOC?: boolean;
  hasPoliticalSpending?: boolean;
  className?: string;
}

export function ApplyWithWDIWF({
  companyId,
  companyName,
  companySlug,
  alignmentScore,
  civicScore = 50,
  hasLayoffs = false,
  hasEEOC = false,
  hasPoliticalSpending = false,
  className,
}: ApplyWithWDIWFProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className={cn("gap-1.5 text-xs font-semibold", className)}
      >
        <Shield className="w-3.5 h-3.5" />
        Apply with WDIWF
      </Button>

      <ApplyDrawer
        open={open}
        onOpenChange={setOpen}
        companyId={companyId}
        companyName={companyName}
        companySlug={companySlug}
        civicScore={civicScore}
        hasLayoffs={hasLayoffs}
        hasEEOC={hasEEOC}
        hasPoliticalSpending={hasPoliticalSpending}
        alignmentScore={alignmentScore}
      />
    </>
  );
}
