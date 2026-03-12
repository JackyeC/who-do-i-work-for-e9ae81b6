import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Heart, Shield, DollarSign, Bot, Building2, Landmark,
  Scale, Monitor, Sparkles, Users, FileText, Save, Info,
  ChevronDown, ChevronRight, Database,
} from "lucide-react";
import { VALUES_LENSES, VALUES_GROUPS } from "@/lib/valuesLenses";

// --- Workplace preference sliders ---
const WORKPLACE_SLIDERS = [
  { key: "pay_transparency_importance", label: "Pay Transparency", icon: DollarSign, description: "Importance of salary transparency and pay equity" },
  { key: "worker_protections_importance", label: "Worker Protections", icon: Shield, description: "Labor rights, safety standards, and employee advocacy" },
  { key: "ai_transparency_importance", label: "AI Transparency", icon: Bot, description: "Ethical AI usage in hiring and workplace decisions" },
  { key: "benefits_importance", label: "Benefits Quality", icon: Heart, description: "Health, wellness, retirement, and perks" },
  { key: "remote_flexibility_importance", label: "Remote Flexibility", icon: Monitor, description: "Flexibility in work location and schedule" },
  { key: "mission_alignment_importance", label: "Mission Alignment", icon: Sparkles, description: "Company mission aligns with your personal values" },
  { key: "political_influence_sensitivity", label: "Political Influence Sensitivity", icon: Scale, description: "Concerns about corporate political spending" },
  { key: "government_contract_preference", label: "Government Contract Comfort", icon: Landmark, description: "Comfort level with government contractor employers" },
  { key: "representation_disclosure_importance", label: "Representation & DEI", icon: Users, description: "Diversity, equity, and inclusion practices" },
] as const;

// --- Build grouped lens sliders ---
const LENS_SLIDERS = VALUES_LENSES.map((lens) => ({
  key: `${lens.key}_importance`,
  label: lens.label,
  icon: lens.icon,
  description: lens.description,
  group: lens.group,
  dataSources: lens.dataSources,
}));

const ALL_SLIDER_KEYS = [
  ...WORKPLACE_SLIDERS.map(s => s.key),
  ...LENS_SLIDERS.map(s => s.key),
];

export function MyValuesProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [sizePreference, setSizePreference] = useState("no_preference");
  const [stagePreference, setStagePreference] = useState("no_preference");
  const [notes, setNotes] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    VALUES_GROUPS.forEach(g => { initial[g.key] = true; });
    return initial;
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-values-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("user_values_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      const w: Record<string, number> = {};
      ALL_SLIDER_KEYS.forEach((k) => { w[k] = profile[k] ?? 50; });
      setWeights(w);
      setSizePreference(profile.company_size_preference || "no_preference");
      setStagePreference(profile.startup_vs_enterprise_preference || "no_preference");
      setNotes(profile.notes || "");
    } else {
      const w: Record<string, number> = {};
      ALL_SLIDER_KEYS.forEach((k) => { w[k] = 50; });
      setWeights(w);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        ...weights,
        company_size_preference: sizePreference,
        startup_vs_enterprise_preference: stagePreference,
        notes: notes || null,
      };
      const { error } = await (supabase as any)
        .from("user_values_profile")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-values-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-alignment-values"] });
      toast.success("Values profile saved!");
    },
    onError: () => toast.error("Failed to save values profile"),
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityLabel = (val: number) => {
    if (val >= 90) return "Deal Breaker";
    if (val >= 70) return "Very Important";
    if (val >= 40) return "Important";
    if (val >= 15) return "Nice to Have";
    return "Not Important";
  };

  const getPriorityColor = (val: number) => {
    if (val >= 90) return "text-destructive";
    if (val >= 70) return "text-primary";
    if (val >= 40) return "text-foreground";
    return "text-muted-foreground";
  };

  const renderSlider = (item: { key: string; label: string; icon: React.ElementType; description: string; dataSources?: readonly string[] }) => {
    const Icon = item.icon;
    const val = weights[item.key] ?? 50;
    return (
      <div key={item.key} className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
              {item.dataSources && item.dataSources.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Database className="w-3 h-3 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground/60">
                    {item.dataSources.slice(0, 2).join(" · ")}
                    {item.dataSources.length > 2 && ` +${item.dataSources.length - 2}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <Badge variant="outline" className="text-xs">{val}</Badge>
            <span className={`text-[10px] font-medium ${getPriorityColor(val)}`}>
              {getPriorityLabel(val)}
            </span>
          </div>
        </div>
        <Slider
          value={[val]}
          onValueChange={(v) => setWeights((p) => ({ ...p, [item.key]: v[0] }))}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    );
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Count active (non-default) values per group
  const getGroupActiveCount = (groupKey: string) => {
    const groupSliders = LENS_SLIDERS.filter(s => s.group === groupKey);
    return groupSliders.filter(s => {
      const val = weights[s.key] ?? 50;
      return val !== 50;
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Transparency disclaimer */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-muted/40 border border-border/40">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your values profile influences your Career Alignment Score, job matching, and company recommendations.
            Slide each value to reflect how important it is to you — <strong>0 = Not Important</strong>, <strong>70+ = Very Important</strong>, <strong>90+ = Deal Breaker</strong>.
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            Every value is tied to verifiable public data sources — no opinions, just receipts.
          </p>
        </div>
      </div>

      {/* Grouped Values Lenses */}
      {VALUES_GROUPS.map((group) => {
        const groupSliders = LENS_SLIDERS.filter(s => s.group === group.key);
        const activeCount = getGroupActiveCount(group.key);
        const isOpen = openGroups[group.key] ?? true;

        return (
          <Card key={group.key} className="border-border">
            <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.key)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <CardTitle className="font-display text-base">{group.label}</CardTitle>
                      {activeCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {activeCount} customized
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{groupSliders.length} values</span>
                  </div>
                  <CardDescription className="ml-6">{group.description}</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {groupSliders.map(renderSlider)}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Workplace Preferences section */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Workplace Preferences</CardTitle>
          </div>
          <CardDescription>
            How important are these day-to-day workplace factors to you?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {WORKPLACE_SLIDERS.map(item => renderSlider(item))}

          {/* Preference selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Company Size Preference
              </label>
              <Select value={sizePreference} onValueChange={setSizePreference}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="small">Small (&lt;100)</SelectItem>
                  <SelectItem value="medium">Medium (100–1000)</SelectItem>
                  <SelectItem value="large">Large (1000+)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (10K+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Stage Preference
              </label>
              <Select value={stagePreference} onValueChange={setStagePreference}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No Preference</SelectItem>
                  <SelectItem value="startup">Startup / Early Stage</SelectItem>
                  <SelectItem value="growth">Growth Stage</SelectItem>
                  <SelectItem value="enterprise">Established Enterprise</SelectItem>
                  <SelectItem value="nonprofit">Non-profit / Mission-driven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-4 border-t border-border">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Additional Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else that matters to you? Deal-breakers, must-haves, causes you'd never want your employer funding..."
              rows={3}
            />
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Values Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
