import { useState } from "react";
import { FileDown, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateDossierPdf } from "@/lib/generateDossierPdf";
import { toast } from "sonner";
import { useTrackedCompanies } from "@/hooks/use-tracked-companies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface ExportDossierButtonProps {
  companyId: string;
  companyName: string;
  company: any;
}

export function ExportDossierButton({ companyId, companyName, company }: ExportDossierButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isCompanyTracked, isPremium } = useTrackedCompanies();
  const navigate = useNavigate();

  const isTracked = isCompanyTracked(companyId);
  // Allow export for any logged-in user (premium gating handled at dossier level)
  const canExport = true;

  const handleExport = async () => {
    if (!canExport) {
      setShowUpgrade(true);
      return;
    }

    setExporting(true);
    try {
      const [
        execRes, contractRes, valuesRes, warnRes, sentimentRes, payEquityRes,
        lobbyRes, partyRes, darkMoneyRes, revolvingRes, stancesRes, benchRes, candidatesRes,
      ] = await Promise.all([
        supabase.from("company_executives").select("*").eq("company_id", companyId),
        supabase.from("company_agency_contracts").select("*").eq("company_id", companyId).order("contract_value", { ascending: false }),
        (supabase as any).from("company_values_signals").select("*").eq("company_id", companyId),
        (supabase as any).from("company_warn_notices").select("*").eq("company_id", companyId).order("notice_date", { ascending: false }),
        (supabase as any).from("company_worker_sentiment").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(1),
        (supabase as any).from("pay_equity_signals").select("*").eq("company_id", companyId),
        (supabase as any).from("company_lobbying_issues").select("*").eq("company_id", companyId),
        supabase.from("company_party_breakdown").select("*").eq("company_id", companyId),
        supabase.from("company_dark_money").select("*").eq("company_id", companyId),
        supabase.from("company_revolving_door").select("*").eq("company_id", companyId),
        supabase.from("company_public_stances").select("*").eq("company_id", companyId),
        supabase.from("company_benchmarks").select("*").eq("company_id", companyId).maybeSingle(),
        supabase.from("company_candidates").select("*").eq("company_id", companyId).order("amount", { ascending: false }),
      ]);

      const doc = generateDossierPdf({
        company,
        executives: execRes.data || [],
        contracts: contractRes.data || [],
        valuesSignals: (valuesRes.data || []) as any[],
        warnNotices: warnRes.data || [],
        sentiment: sentimentRes.data || [],
        payEquity: (payEquityRes.data || []) as any[],
        lobbyingIssues: (lobbyRes.data || []) as any[],
        partyBreakdown: partyRes.data || [],
        darkMoney: darkMoneyRes.data || [],
        revolvingDoor: revolvingRes.data || [],
        publicStances: stancesRes.data || [],
        benchmarks: benchRes.data || null,
        candidates: candidatesRes.data || [],
      });

      const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      doc.save(`${slug}-integrity-brief.pdf`);
      toast.success("Integrity Brief downloaded");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={exporting}
        variant={canExport ? "outline" : "secondary"}
        size="sm"
        className="gap-2"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : canExport ? (
          <FileDown className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {exporting ? "Generating…" : "Download Integrity Brief"}
      </Button>

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Upgrade to Export
            </DialogTitle>
            <DialogDescription>
              The Integrity Brief is a premium export available to Pro subscribers who are actively tracking this company. Track {companyName} to unlock the full intelligence dossier and downloadable PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowUpgrade(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowUpgrade(false); navigate("/pricing"); }}>
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
