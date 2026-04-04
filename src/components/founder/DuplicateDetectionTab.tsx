import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Loader2, Search, Merge, Eye, EyeOff, Plus, RefreshCw,
  Building2, Globe, ExternalLink, CheckCircle, XCircle,
} from "lucide-react";

interface DuplicatePair {
  id: string;
  similarity_score: number;
  match_reason: string | null;
  status: string;
  created_at: string;
  company_a: { id: string; name: string; slug: string; industry: string; state: string; website_url: string | null; domain: string | null; identity_status: string };
  company_b: { id: string; name: string; slug: string; industry: string; state: string; website_url: string | null; domain: string | null; identity_status: string };
}

function CompanyCard({ company, label }: { company: DuplicatePair["company_a"]; label: string }) {
  return (
    <div className="flex-1 rounded-lg border border-border p-3 space-y-1.5 bg-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-semibold text-sm text-foreground truncate">{company.name}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
        <span>{company.industry}</span>
        <span>·</span>
        <span>{company.state}</span>
      </div>
      {company.domain && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Globe className="w-3 h-3" />
          <span className="font-mono">{company.domain}</span>
        </div>
      )}
      <Badge variant={company.identity_status === "complete" ? "default" : "secondary"} className="text-[10px]">
        {company.identity_status}
      </Badge>
    </div>
  );
}

function MatchBadge({ reason, score }: { reason: string | null; score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.95 ? "bg-destructive/10 text-destructive" : score >= 0.8 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${color}`}>
      <span>{pct}% match</span>
      {reason && <span className="opacity-70">· {reason?.replace(/_/g, " ")}</span>}
    </div>
  );
}

export function DuplicateDetectionTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"pending" | "merged" | "dismissed">("pending");
  const [mergeConfirm, setMergeConfirm] = useState<DuplicatePair | null>(null);
  const [aliasDialog, setAliasDialog] = useState<DuplicatePair | null>(null);
  const [aliasName, setAliasName] = useState("");

  const { data: pairs, isLoading } = useQuery({
    queryKey: ["potential-duplicates", statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("potential_duplicates")
        .select(`
          id, similarity_score, match_reason, status, created_at,
          company_a:companies!potential_duplicates_company_a_id_fkey(id, name, slug, industry, state, website_url, domain, identity_status),
          company_b:companies!potential_duplicates_company_b_id_fkey(id, name, slug, industry, state, website_url, domain, identity_status)
        `)
        .eq("status", statusFilter)
        .order("similarity_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        company_a: d.company_a,
        company_b: d.company_b,
      })) as DuplicatePair[];
    },
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("resolve-company-identity", {
        body: { mode: "scan" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Scan complete", description: `${data?.duplicatesFound ?? 0} potential duplicates found.` });
      queryClient.invalidateQueries({ queryKey: ["potential-duplicates"] });
    },
    onError: (e: any) => toast({ title: "Scan failed", description: e.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("potential_duplicates").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["potential-duplicates"] }),
  });

  const mergeMutation = useMutation({
    mutationFn: async (pair: DuplicatePair) => {
      // Move related data from company_b into company_a, then delete company_b
      const relatedTables = [
        "company_executives", "company_candidates", "company_agency_contracts",
        "company_dark_money", "company_flagged_orgs", "company_ideology_flags",
        "company_foundation_grants", "company_advisory_committees",
        "company_corporate_structure", "company_board_affiliations",
        "entity_linkages", "board_members", "ai_hiring_signals", "ai_hr_signals",
        "company_party_breakdown", "company_revolving_door",
        "company_trade_associations", "company_state_lobbying",
        "organization_profile_enrichment", "company_jobs",
      ];
      for (const table of relatedTables) {
        try {
          await (supabase as any).from(table).update({ company_id: pair.company_a.id }).eq("company_id", pair.company_b.id);
        } catch { /* skip */ }
      }
      // Add alias
      await supabase.from("company_aliases").upsert({
        company_id: pair.company_a.id,
        alias_name: pair.company_b.name,
        alias_type: "merged_duplicate",
        confidence: pair.similarity_score,
      }, { onConflict: "company_id,alias_name" });
      // Delete source company
      await supabase.from("companies").delete().eq("id", pair.company_b.id);
      // Mark as merged
      await supabase.from("potential_duplicates").update({ status: "merged", reviewed_at: new Date().toISOString() }).eq("id", pair.id);
    },
    onSuccess: () => {
      toast({ title: "Companies merged" });
      queryClient.invalidateQueries();
      setMergeConfirm(null);
    },
    onError: (e: any) => toast({ title: "Merge failed", description: e.message, variant: "destructive" }),
  });

  const addAlias = useMutation({
    mutationFn: async ({ pair, alias }: { pair: DuplicatePair; alias: string }) => {
      await supabase.from("company_aliases").upsert([
        { company_id: pair.company_a.id, alias_name: alias, alias_type: "admin_linked", confidence: 0.85 },
        { company_id: pair.company_b.id, alias_name: alias, alias_type: "admin_linked", confidence: 0.85 },
      ], { onConflict: "company_id,alias_name" });
      await supabase.from("potential_duplicates").update({ status: "dismissed", reviewed_at: new Date().toISOString() }).eq("id", pair.id);
    },
    onSuccess: () => {
      toast({ title: "Alias added & pair dismissed" });
      queryClient.invalidateQueries({ queryKey: ["potential-duplicates"] });
      setAliasDialog(null);
      setAliasName("");
    },
  });

  const pendingCount = pairs?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Duplicate Detection</h2>
          <p className="text-xs text-muted-foreground">Review and resolve potential duplicate companies</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
          {scanMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Run Scan
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(["pending", "merged", "dismissed"] as const).map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "ghost"} className="text-xs h-7 capitalize" onClick={() => setStatusFilter(s)}>
            {s}
            {s === "pending" && pendingCount > 0 && statusFilter === "pending" && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">{pendingCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : !pairs?.length ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No {statusFilter} duplicates found.
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair) => (
            <div key={pair.id} className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <MatchBadge reason={pair.match_reason} score={pair.similarity_score} />
                <span className="text-[10px] text-muted-foreground">{new Date(pair.created_at).toLocaleDateString()}</span>
              </div>

              {/* Side-by-side */}
              <div className="flex gap-3">
                {pair.company_a && <CompanyCard company={pair.company_a} label="Company A" />}
                {pair.company_b && <CompanyCard company={pair.company_b} label="Company B" />}
              </div>

              {/* Actions */}
              {statusFilter === "pending" && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Button size="sm" variant="default" className="text-xs gap-1 h-7" onClick={() => setMergeConfirm(pair)}>
                    <Merge className="w-3 h-3" /> Merge
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => updateStatus.mutate({ id: pair.id, status: "dismissed" })}>
                    <XCircle className="w-3 h-3" /> Keep Separate
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs gap-1 h-7" onClick={() => { setAliasDialog(pair); setAliasName(""); }}>
                    <Plus className="w-3 h-3" /> Add Alias
                  </Button>
                  <div className="ml-auto flex gap-1">
                    <a href={`/dossier/${pair.company_a?.slug}`} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                      View A <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a href={`/dossier/${pair.company_b?.slug}`} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                      View B <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}
              {statusFilter !== "pending" && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {pair.status === "merged" ? <><CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Merged</> : <><EyeOff className="w-2.5 h-2.5 mr-0.5" /> Dismissed</>}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merge confirmation */}
      <AlertDialog open={!!mergeConfirm} onOpenChange={() => setMergeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge companies?</AlertDialogTitle>
            <AlertDialogDescription>
              All data from <strong>{mergeConfirm?.company_b?.name}</strong> will be moved into <strong>{mergeConfirm?.company_a?.name}</strong>. The duplicate will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => mergeConfirm && mergeMutation.mutate(mergeConfirm)} disabled={mergeMutation.isPending} className="gap-1.5">
              {mergeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alias dialog */}
      <AlertDialog open={!!aliasDialog} onOpenChange={() => setAliasDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add shared alias</AlertDialogTitle>
            <AlertDialogDescription>
              Link both companies with a common alias name, then dismiss this pair.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Alias name..." value={aliasName} onChange={(e) => setAliasName(e.target.value)} className="my-2" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => aliasDialog && aliasName && addAlias.mutate({ pair: aliasDialog, alias: aliasName })} disabled={!aliasName || addAlias.isPending}>
              {addAlias.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Alias
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
