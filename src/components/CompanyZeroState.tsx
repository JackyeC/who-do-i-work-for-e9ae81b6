import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CompanyZeroStateProps {
  companyName: string;
  onDiscovered?: (companyId: string, slug: string) => void;
}

export function CompanyZeroState({ companyName, onDiscovered }: CompanyZeroStateProps) {
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-discover", {
        body: { companyName, searchQuery: companyName },
      });
      if (error) throw error;
      if (data?.companyId && data?.slug) {
        toast.success("Company discovered! Loading intelligence preview...");
        if (onDiscovered) {
          onDiscovered(data.companyId, data.slug);
        } else {
          navigate(`/dossier/${data.slug}`);
        }
      } else {
        toast.error("Discovery completed but no matching company was found. Try a different name.");
      }
    } catch (e: any) {
      console.error("Discovery failed:", e);
      toast.error("Intelligence scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="border-border/40 border-dashed">
      <CardContent className="p-8 text-center">
        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-2">
          🔍 Company not vetted yet.
        </h3>
        <p className="text-sm text-muted-foreground mb-1 max-w-md mx-auto">
          <span className="font-medium text-foreground">{companyName}</span> isn't in our vetted database.
        </p>
        <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
          Start a Global Intelligence Scan to pull leadership, political spending, and workplace policy signals.
        </p>
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning intelligence sources...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Start Global Intelligence Scan
            </>
          )}
        </Button>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            AI Draft — Jackye's Vetting Pending
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Results are AI-generated previews. Full vetting requires Jackye's review.
        </p>
      </CardContent>
    </Card>
  );
}
