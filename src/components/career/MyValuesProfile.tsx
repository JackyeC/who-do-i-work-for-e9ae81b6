import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Heart, Shield, DollarSign, Bot, Building2, Landmark,
  Scale, Monitor, Sparkles, Users, FileText, Save
} from "lucide-react";

const VALUE_SLIDERS = [
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

export function MyValuesProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [sizePreference, setSizePreference] = useState("no_preference");
  const [stagePreference, setStagePreference] = useState("no_preference");
  const [notes, setNotes] = useState("");

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
      VALUE_SLIDERS.forEach((s) => { w[s.key] = profile[s.key] ?? 50; });
      setWeights(w);
      setSizePreference(profile.company_size_preference || "no_preference");
      setStagePreference(profile.startup_vs_enterprise_preference || "no_preference");
      setNotes(profile.notes || "");
    } else {
      const w: Record<string, number> = {};
      VALUE_SLIDERS.forEach((s) => { w[s.key] = 50; });
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

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[hsl(var(--civic-gold))]" />
            <CardTitle className="font-display">My Workplace Values</CardTitle>
          </div>
          <CardDescription>
            Define what matters most to you. These values influence your Career Alignment Score, job matching, and outreach recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {VALUE_SLIDERS.map((item) => {
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
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{val}</Badge>
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
          })}

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
              placeholder="Anything else that matters to you in a workplace? (e.g., specific causes, deal-breakers, must-haves)"
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
