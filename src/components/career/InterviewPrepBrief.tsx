import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, X, FileSearch } from "lucide-react";
import type { CompanyResult } from "@/components/career/EmployerDossierSearch";

interface PrepBrief {
  company: string;
  role?: string | null;
  intel_summary: string;
  checklist: {
    research: string[];
    questions_to_ask: string[];
    watch_for: string[];
    power_move: string;
  };
}

interface Props {
  selectedCompany: CompanyResult | null;
}

export function InterviewPrepBrief({ selectedCompany }: Props) {
  const { user } = useAuth();
  const [companyInput, setCompanyInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [useSelected, setUseSelected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<PrepBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [savedCompanyName, setSavedCompanyName] = useState<string | null>(null);
  const [isRestoredBrief, setIsRestoredBrief] = useState(false);

  // Load last saved brief on mount
  useEffect(() => {
    if (!user) return;
    const loadSaved = async () => {
      const { data } = await supabase
        .from("interview_prep_briefs")
        .select("company_name, role, intel_summary, checklist")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const restored: PrepBrief = {
          company: data.company_name,
          role: data.role,
          intel_summary: data.intel_summary,
          checklist: data.checklist as PrepBrief["checklist"],
        };
        setBrief(restored);
        setCompanyInput(data.company_name);
        setRoleInput(data.role || "");
        setSavedCompanyName(data.company_name);
        setIsRestoredBrief(true);
        setUseSelected(false);
      }
    };
    loadSaved();
  }, [user]);

  const companyName = useSelected && selectedCompany ? selectedCompany.name : companyInput;
  const companyId = useSelected && selectedCompany ? selectedCompany.id : undefined;

  const saveBrief = async (briefData: PrepBrief) => {
    if (!user) return;
    try {
      await supabase.from("interview_prep_briefs").insert({
        user_id: user.id,
        company_name: briefData.company || companyName.trim(),
        role: briefData.role || null,
        intel_summary: briefData.intel_summary,
        checklist: briefData.checklist as any,
      });
    } catch (e) {
      console.error("Failed to save brief:", e);
    }
  };

  const handleGenerate = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);
    setBrief(null);
    setChecked({});
    setIsRestoredBrief(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("interview-prep-brief", {
        body: {
          companyName: companyName.trim(),
          companyId,
          role: roleInput.trim() || undefined,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (!data?.intel_summary || !data?.checklist) {
        console.error("Malformed response:", data);
        throw new Error("malformed");
      }

      const parsedBrief = data as PrepBrief;
      setBrief(parsedBrief);
      setSavedCompanyName(companyName.trim());
      await saveBrief(parsedBrief);
    } catch (e: any) {
      console.error("Interview prep brief error:", e);
      setError("Couldn't pull intel on this one. Double-check the company name and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartFresh = () => {
    setBrief(null);
    setCompanyInput("");
    setRoleInput("");
    setChecked({});
    setSavedCompanyName(null);
    setIsRestoredBrief(false);
    setUseSelected(!!selectedCompany);
  };

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const displayName = companyName || "this company";

  return (
    <div className="max-w-2xl mx-auto mb-8 space-y-4">
      {/* Restored brief label */}
      {isRestoredBrief && savedCompanyName && brief && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Your last prep brief — {savedCompanyName}</span>
          <button onClick={handleStartFresh} className="underline hover:text-foreground transition-colors">
            Start fresh
          </button>
        </div>
      )}

      {/* Input Block */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="w-4 h-4" /> Interview Prep Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {useSelected && selectedCompany ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Company:</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                {selectedCompany.name}
                <button onClick={() => setUseSelected(false)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          ) : (
            <Input
              placeholder="Which company are you interviewing at?"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
            />
          )}

          <Input
            placeholder="What role are you interviewing for? (optional)"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
          />

          <Button
            onClick={handleGenerate}
            disabled={!companyName.trim() || loading}
            className="w-full"
          >
            Get My Prep Brief
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-8 space-y-4">
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              Pulling the receipts on {displayName}...
            </p>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="pt-4 space-y-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* BLOCK 1 — Intel Summary */}
      {brief && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Company Intel Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{brief.intel_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* BLOCK 2 — Prep Checklist */}
      {brief && (
        <Card>
          <CardContent className="py-5 space-y-0">
            <ChecklistGroup items={brief.checklist.research} prefix="research" checked={checked} onToggle={toggle} />
            <Divider />
            <ChecklistGroup items={brief.checklist.questions_to_ask} prefix="ask" checked={checked} onToggle={toggle} />
            <Divider />
            <ChecklistGroup items={brief.checklist.watch_for} prefix="watch" checked={checked} onToggle={toggle} />
            <Divider />
            <div className="border-l-2 border-primary pl-3 py-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={!!checked["power"]} onCheckedChange={() => toggle("power")} className="mt-0.5" />
                <span className="text-sm font-medium leading-relaxed">{brief.checklist.power_move}</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChecklistGroup({ items, prefix, checked, onToggle }: {
  items: string[];
  prefix: string;
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-2 py-2">
      {items.map((item, i) => {
        const key = `${prefix}-${i}`;
        return (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={!!checked[key]} onCheckedChange={() => onToggle(key)} className="mt-0.5" />
            <span className="text-sm leading-relaxed">{item}</span>
          </label>
        );
      })}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/50 my-1" />;
}
