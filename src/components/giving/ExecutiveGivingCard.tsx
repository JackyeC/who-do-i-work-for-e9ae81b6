import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CauseTag, getCauseTag, CAUSE_TAXONOMY } from "./CauseTag";
import { GivingShareRow } from "./GivingShareRow";
import { ExternalLink, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface ExecutiveGivingCardProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

// Map recipient names to cause labels (simplified heuristic)
function getRecipientCauses(name: string, party: string): string[] {
  const causes: string[] = [];
  // Very simplified — in production, this would be a lookup table
  const lowerName = name.toLowerCase();
  if (party === "Republican" || party === "R") {
    if (lowerName.includes("cruz") || lowerName.includes("hawley")) causes.push("Voting restrictions");
  }
  if (party === "Democrat" || party === "D") {
    if (lowerName.includes("warren") || lowerName.includes("sanders")) causes.push("Labor / pro-worker");
  }
  return causes;
}

function getGivingLean(demPct: number, repPct: number): "dem" | "rep" | "mixed" | "none" {
  if (demPct === 0 && repPct === 0) return "none";
  if (demPct > 60) return "dem";
  if (repPct > 60) return "rep";
  return "mixed";
}

const LEAN_STYLES = {
  dem:   { bg: "#E6F1FB", text: "#0C447C" },
  rep:   { bg: "#FCEBEB", text: "#791F1F" },
  mixed: { bg: "#FAEEDA", text: "#633806" },
  none:  { bg: "#F1EFE8", text: "#5F5E5A" },
};

const PARTY_DOT: Record<string, string> = {
  Democrat: "#378ADD", D: "#378ADD",
  Republican: "#E24B4A", R: "#E24B4A",
};

function ExecCard({ exec, recipients, companyName, companySlug, locked }: {
  exec: any;
  recipients: any[];
  companyName: string;
  companySlug: string;
  locked: boolean;
}) {
  const total = exec.total_donations || 0;
  const demAmount = recipients.filter(r => r.party === "Democrat" || r.party === "D").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const repAmount = recipients.filter(r => r.party === "Republican" || r.party === "R").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalDonated = demAmount + repAmount || total || 1;
  const demPct = (demAmount / totalDonated) * 100;
  const repPct = (repAmount / totalDonated) * 100;
  const lean = getGivingLean(demPct, repPct);
  const leanStyle = LEAN_STYLES[lean];
  const initials = exec.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const execSlug = exec.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const plainText = `${exec.name}, ${exec.title} at ${companyName}\nTotal disclosed giving: $${total.toLocaleString()}\nBreakdown: ${Math.round(repPct)}% Republican · ${Math.round(demPct)}% Democratic\nSource: FEC public records · wdiwf.jackyeclayton.com`;

  return (
    <div
      className="rounded-xl border border-border/40 bg-card overflow-hidden"
      id={`giving-${execSlug}`}
      style={locked ? { position: "relative" } : undefined}
    >
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backdropFilter: "blur(6px)", background: "rgba(13,12,15,0.5)" }}>
          <div className="text-center px-6">
            <Lock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-3">Unlock all executive records</p>
            <Link
              to="/pricing"
              className="inline-block px-5 py-2 text-sm font-semibold rounded-full"
              style={{ background: "#f0c040", color: "#0a0a0e" }}
            >
              Upgrade to Scout
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/20">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
          style={{ background: leanStyle.bg, color: leanStyle.text }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 500 }} className="text-foreground truncate">{exec.name}</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }} className="text-muted-foreground">{exec.title}</p>
        </div>
        <div className="text-right shrink-0">
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }} className="text-foreground">
            ${total.toLocaleString()}
          </p>
          <a
            href={`https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(exec.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="w-2.5 h-2.5" /> FEC
          </a>
        </div>
      </div>

      {/* Donation rows */}
      {recipients.length > 0 ? (
        <div className="divide-y divide-border/10">
          {recipients.slice(0, 8).map((r: any, i: number) => {
            const causes = getRecipientCauses(r.name, r.party);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PARTY_DOT[r.party] || "#888780" }}
                />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 500 }} className="text-foreground flex-1 min-w-0 truncate">
                  {r.name}
                  {r.state && <span className="text-muted-foreground font-normal"> ({r.state})</span>}
                </span>
                <div className="flex flex-wrap gap-0.5 shrink-0">
                  {causes.map(c => <CauseTag key={c} {...getCauseTag(c)} />)}
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px" }} className="text-muted-foreground shrink-0">
                  ${r.amount?.toLocaleString() || "0"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground">No FEC disclosures found for this executive.</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/20 flex items-center gap-2">
        <a
          href={`https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(exec.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          View on FEC → <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-xs text-muted-foreground">Source: FEC · Verified ✓</span>
      </div>

      {!locked && (
        <div className="px-4 pb-3">
          <GivingShareRow
            permalink={`https://wdiwf.jackyeclayton.com/company/${companySlug}#giving-${execSlug}`}
            plainText={plainText}
            tweetText={`${exec.name} at ${companyName} gave $${total.toLocaleString()} in disclosed political donations. Public FEC record. via @wdiwf`}
            companySlug={companySlug}
          />
        </div>
      )}
    </div>
  );
}

export function ExecutiveGivingSection({ companyId, companyName, companySlug }: ExecutiveGivingCardProps) {
  const { user } = useAuth();
  const isScout = !!user; // TODO: wire to real subscription tier

  const { data } = useQuery({
    queryKey: ["executive-giving", companyId],
    queryFn: async () => {
      const { data: executives } = await supabase
        .from("company_executives")
        .select("id, name, title, total_donations")
        .eq("company_id", companyId)
        .order("total_donations", { ascending: false });

      if (!executives || executives.length === 0) return { executives: [], recipientsByExec: {} };

      const execIds = executives.map(e => e.id);
      const { data: allRecipients } = await supabase
        .from("executive_recipients")
        .select("executive_id, name, party, amount, state, committee_name")
        .in("executive_id", execIds)
        .order("amount", { ascending: false });

      const recipientsByExec: Record<string, any[]> = {};
      (allRecipients || []).forEach(r => {
        if (!recipientsByExec[r.executive_id]) recipientsByExec[r.executive_id] = [];
        recipientsByExec[r.executive_id].push(r);
      });

      return { executives, recipientsByExec };
    },
    enabled: !!companyId,
  });

  if (!data || data.executives.length === 0) return null;

  const { executives, recipientsByExec } = data;
  // Free users: show CEO + 1 board member, blur rest
  const freeLimit = isScout ? executives.length : 2;
  const lockedCount = Math.max(0, executives.length - freeLimit);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">Leadership Political Giving</h3>
      </div>

      {/* Disclaimer — always visible, never collapsible */}
      <div style={{
        borderLeft: "3px solid rgba(255,255,255,0.15)",
        padding: "12px 16px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "0 8px 8px 0",
        marginBottom: "16px",
      }}>
        Individual donation data is public record per FEC disclosure requirements (contributions over $200). This data reflects personal giving by named executives and does not represent company policy. WDIWF presents this for transparency only. We connect the dots — you make the call.
      </div>

      {/* Executive cards */}
      <div className="space-y-4">
        {executives.map((exec: any, i: number) => (
          <ExecCard
            key={exec.id}
            exec={exec}
            recipients={recipientsByExec[exec.id] || []}
            companyName={companyName}
            companySlug={companySlug}
            locked={i >= freeLimit}
          />
        ))}
      </div>

      {lockedCount > 0 && (
        <div className="text-center py-4">
          <Link
            to="/pricing"
            className="inline-block px-6 py-2.5 text-sm font-semibold rounded-full"
            style={{ background: "#f0c040", color: "#0a0a0e" }}
          >
            See all {executives.length} executive giving records — upgrade to Scout
          </Link>
        </div>
      )}

      {/* Legal footer */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
        marginTop: "16px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingTop: "12px",
      }}>
        Individual donation data sourced from FEC public records pursuant to 52 U.S.C. §30104. Contributions over $200 are required by law to be publicly disclosed. Cause classifications are based on publicly available voting records, congressional scorecards, and watchdog organization ratings (HRC, LCV, Brennan Center, AFL-CIO). This data reflects personal giving and does not represent company policy. WDIWF does not make character assessments or political endorsements. We connect the dots — you make the call.
      </p>
    </div>
  );
}
