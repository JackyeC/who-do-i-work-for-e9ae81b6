import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Merge, Loader2, Search, Building2 } from "lucide-react";

interface AdminCompanyActionsProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

export function AdminCompanyActions({ companyId, companyName, companySlug }: AdminCompanyActionsProps) {
  const { isAdmin, isOwner } = useUserRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<any[]>([]);
  const [mergeSearching, setMergeSearching] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<any>(null);
  const [isMerging, setIsMerging] = useState(false);

  if (!isAdmin && !isOwner) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete related data first (cascading doesn't cover all tables)
      const relatedTables = [
        "company_executives", "company_candidates", "company_agency_contracts",
        "company_dark_money", "company_flagged_orgs", "company_ideology_flags",
        "company_foundation_grants", "company_advisory_committees",
        "company_corporate_structure", "company_board_affiliations",
        "company_benchmarks", "company_hypocrisy_index",
        "entity_linkages", "board_members", "ai_hiring_signals", "ai_hr_signals",
        "company_party_breakdown", "company_revolving_door",
        "company_trade_associations", "company_state_lobbying",
        "organization_profile_enrichment", "company_jobs",
      ];

      for (const table of relatedTables) {
        try {
          await (supabase as any).from(table).delete().eq("company_id", companyId);
        } catch {
          // Some tables may not exist or have different FK names
        }
      }

      // Delete the company itself
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
      if (error) throw error;

      toast({ title: "Company deleted", description: `${companyName} has been removed.` });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate("/browse");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const searchMergeTargets = async () => {
    if (mergeSearch.length < 2) return;
    setMergeSearching(true);
    try {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, state")
        .neq("id", companyId)
        .ilike("name", `%${mergeSearch}%`)
        .limit(10);
      setMergeResults(data || []);
    } catch {
      setMergeResults([]);
    } finally {
      setMergeSearching(false);
    }
  };

  const handleMerge = async () => {
    if (!mergeTarget) return;
    setIsMerging(true);
    try {
      // Move all related data from this company to the target
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
          await (supabase as any)
            .from(table)
            .update({ company_id: mergeTarget.id })
            .eq("company_id", companyId);
        } catch {
          // Skip tables that don't exist
        }
      }

      // Delete the source company
      await supabase.from("companies").delete().eq("id", companyId);

      toast({ title: "Companies merged", description: `Data merged into ${mergeTarget.name}. Redirecting...` });
      queryClient.invalidateQueries();
      navigate(`/company/${mergeTarget.slug}`);
    } catch (e: any) {
      toast({ title: "Merge failed", description: e.message, variant: "destructive" });
    } finally {
      setIsMerging(false);
      setMergeOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className="text-xs text-muted-foreground border-muted">Admin</Badge>
      
      {/* Merge */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
            <Merge className="w-3 h-3" />
            Merge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge "{companyName}" into another company</DialogTitle>
            <DialogDescription>
              All data from this company will be moved to the target. This company will then be deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search target company..."
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMergeTargets()}
              />
              <Button size="sm" onClick={searchMergeTargets} disabled={mergeSearching}>
                {mergeSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </Button>
            </div>

            {mergeResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {mergeResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setMergeTarget(c)}
                    className={`w-full text-left p-2 rounded-lg border text-sm transition-colors ${
                      mergeTarget?.id === c.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.industry}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleMerge} 
              disabled={!mergeTarget || isMerging}
              className="gap-1.5"
            >
              {isMerging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
              Merge into {mergeTarget?.name || "..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{companyName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this company and all associated data (executives, donations, contracts, signals, etc). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
