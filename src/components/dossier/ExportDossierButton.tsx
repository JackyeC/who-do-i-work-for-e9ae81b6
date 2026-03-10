import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateDossierPdf } from "@/lib/generateDossierPdf";
import { toast } from "sonner";

interface ExportDossierButtonProps {
  companyId: string;
  companyName: string;
  company: any;
}

export function ExportDossierButton({ companyId, companyName, company }: ExportDossierButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch ALL intelligence layers in parallel for the richest possible export
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
        supabase.from("company_benchmarks").select("*").eq("company_id", companyId).single(),
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
      doc.save(`${slug}-intelligence-dossier.pdf`);
      toast.success("Intelligence Dossier exported");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {exporting ? "Generating…" : "Export Intelligence Brief"}
    </Button>
  );
}
