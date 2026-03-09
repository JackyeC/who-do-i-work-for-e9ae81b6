import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Shield, DollarSign, Bot, Building2, Landmark, Scale, Leaf, Users, Medal, Sparkles } from "lucide-react";

const VALUE_CATEGORIES = [
  { key: "pay_equity_weight", label: "Pay Equity & Transparency", icon: DollarSign, description: "Fair compensation practices" },
  { key: "worker_protections_weight", label: "Worker Protections", icon: Shield, description: "Labor rights and safety" },
  { key: "ai_transparency_weight", label: "AI Transparency", icon: Bot, description: "Ethical AI usage in hiring" },
  { key: "benefits_quality_weight", label: "Benefits Quality", icon: Heart, description: "Health, wellness, and perks" },
  { key: "organizational_affiliations_weight", label: "Organizational Affiliations", icon: Building2, description: "Trade associations and partnerships" },
  { key: "government_contracts_weight", label: "Government Contracts", icon: Landmark, description: "Public sector work" },
  { key: "political_neutrality_weight", label: "Political Neutrality", icon: Scale, description: "Balanced political activity" },
  { key: "environmental_commitment_weight", label: "Environmental Commitment", icon: Leaf, description: "Sustainability practices" },
  { key: "dei_commitment_weight", label: "DEI Commitment", icon: Users, description: "Diversity and inclusion" },
  { key: "veteran_support_weight", label: "Veteran Support", icon: Medal, description: "Military-friendly employer" },
] as const;

export function UserValuesProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [weights, setWeights] = useState<Record<string, number>>({});

  const { data: valuesProfile, isLoading } = useQuery({
    queryKey: ["user-alignment-values", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_alignment_values")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialize weights from profile or defaults
  useState(() => {
    if (valuesProfile) {
      const initialWeights: Record<string, number> = {};
      VALUE_CATEGORIES.forEach((cat) => {
        initialWeights[cat.key] = valuesProfile[cat.key] || 50;
      });
      setWeights(initialWeights);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, number>) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_alignment_values")
        .upsert({
          user_id: user.id,
          ...values,
        }, { onConflict: "user_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-alignment-values"] });
      toast.success("Values profile saved successfully");
    },
    onError: () => {
      toast.error("Failed to save values profile");
    },
  });

  const handleWeightChange = (key: string, value: number[]) => {
    setWeights((prev) => ({ ...prev, [key]: value[0] }));
  };

  const handleSave = () => {
    saveMutation.mutate(weights);
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const avgWeight = totalWeight / VALUE_CATEGORIES.length;

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
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-civic-gold" />
          <CardTitle>Your Values Profile</CardTitle>
        </div>
        <CardDescription>
          Adjust the importance of each factor in your career alignment score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Weight Indicator */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <span className="text-sm font-medium">Average Weight</span>
          <Badge variant="secondary" className="text-sm">
            {avgWeight.toFixed(0)}
          </Badge>
        </div>

        {/* Value Sliders */}
        <div className="space-y-6">
          {VALUE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const currentWeight = weights[category.key] || 50;
            
            return (
              <div key={category.key} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">{category.label}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {currentWeight}
                  </Badge>
                </div>
                <Slider
                  value={[currentWeight]}
                  onValueChange={(value) => handleWeightChange(category.key, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="w-full"
            size="lg"
          >
            {saveMutation.isPending ? "Saving..." : "Save Values Profile"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Your values profile will be used to calculate alignment scores across jobs and companies.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}