import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, ShieldCheck, Clock, Building2, Mail, FileText, Scale } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const CERTIFICATION_CRITERIA = [
  {
    id: "identity",
    icon: Mail,
    label: "Identity Linkage",
    description: "Account manager has a verified corporate email domain matching the company.",
  },
  {
    id: "disclosure",
    icon: FileText,
    label: "Documented Disclosure",
    description: "Employer provided a public-facing document (DEI Report, ESG Statement, or Employee Handbook) supporting their Official Response.",
  },
  {
    id: "non-interference",
    icon: Scale,
    label: "Non-Interference Agreement",
    description: "Employer acknowledges zero authority to edit, remove, or suppress any data found by AI or independent research.",
  },
];

export function CertificationQueue() {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<Record<string, Set<string>>>({});

  // Companies with vetted_status = 'unverified' that have been claimed (have a description or creation_source)
  const { data: pending, isLoading } = useQuery({
    queryKey: ["admin-certification-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, industry, vetted_status, created_at, creation_source, logo_url")
        .eq("vetted_status", "unverified")
        .not("creation_source", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const toggleCheck = (companyId: string, criterionId: string) => {
    setChecklist((prev) => {
      const current = new Set(prev[companyId] || []);
      if (current.has(criterionId)) {
        current.delete(criterionId);
      } else {
        current.add(criterionId);
      }
      return { ...prev, [companyId]: current };
    });
  };

  const getChecked = (companyId: string) => checklist[companyId] || new Set();
  const allChecked = (companyId: string) => getChecked(companyId).size === 3;

  const handleAction = async (companyId: string, newStatus: "verified" | "certified") => {
    if (newStatus === "certified" && !allChecked(companyId)) {
      toast.error("All 3 certification criteria must be verified before granting Gold Shield.");
      return;
    }
    const { error } = await supabase
      .from("companies")
      .update({ vetted_status: newStatus })
      .eq("id", companyId);
    if (error) {
      toast.error("Update failed: " + error.message);
      return;
    }
    toast.success(`Company ${newStatus === "certified" ? "certified with Gold Shield" : "verified"}!`);
    queryClient.invalidateQueries({ queryKey: ["admin-certification-queue"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" /> Employer Certification
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review employer claims against the 3-point transparency audit before granting Gold Shield status.
        </p>
      </div>

      {/* Criteria Reference */}
      <Card className="border-border/40 bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Certification Criteria</p>
          <div className="space-y-2">
            {CERTIFICATION_CRITERIA.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <c.icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-foreground">{c.label}:</span>{" "}
                  <span className="text-xs text-muted-foreground">{c.description}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !pending?.length ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="p-6 text-center">
            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No certification requests pending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((co: any) => {
            const checked = getChecked(co.id);
            return (
              <Card key={co.id} className="border-border/40">
                <CardContent className="p-4 space-y-3">
                  {/* Company header */}
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{co.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {co.industry} · {co.creation_source || "Unknown source"} · {formatDistanceToNow(new Date(co.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">Unverified</Badge>
                  </div>

                  {/* 3-Point Checklist */}
                  <div className="pl-7 space-y-1.5">
                    {CERTIFICATION_CRITERIA.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked.has(c.id)}
                          onChange={() => toggleCheck(co.id, c.id)}
                          className="w-3.5 h-3.5 rounded border-border accent-primary"
                        />
                        <span className={`text-xs transition-colors ${checked.has(c.id) ? "text-foreground" : "text-muted-foreground"}`}>
                          {c.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 pl-7">
                    <Button size="sm" variant="outline" onClick={() => handleAction(co.id, "verified")} className="text-xs gap-1 h-7 px-2">
                      <Check className="w-3 h-3" /> Verify Only
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(co.id, "certified")}
                      className="text-xs gap-1 h-7 px-2"
                      disabled={!allChecked(co.id)}
                      title={!allChecked(co.id) ? "Complete all 3 criteria first" : "Grant Gold Shield"}
                    >
                      <ShieldCheck className="w-3 h-3" /> Certify (Gold Shield)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
