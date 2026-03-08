import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Shield, Star, Dog, Landmark, Flag, Leaf, Users, Sparkles } from "lucide-react";

export const VALUE_CATEGORIES = [
  { key: "faith_friendly", label: "Faith / Christian Values", icon: Star, color: "text-amber-500" },
  { key: "supports_israel", label: "Supports Israel", icon: Landmark, color: "text-blue-500" },
  { key: "animal_welfare", label: "Animal / Pet Welfare", icon: Dog, color: "text-orange-500" },
  { key: "anti_discrimination", label: "Anti-Discrimination / DEI", icon: Shield, color: "text-emerald-500" },
  { key: "dei_rollback", label: "DEI Rollback Tracker", icon: Flag, color: "text-red-500" },
  { key: "environmental", label: "Environmental Commitment", icon: Leaf, color: "text-green-500" },
  { key: "veteran_support", label: "Veteran / Military Support", icon: Users, color: "text-indigo-500" },
  { key: "lgbtq_inclusive", label: "LGBTQ+ Inclusive", icon: Heart, color: "text-pink-500" },
] as const;

interface Props {
  onFiltersChange: (filters: string[]) => void;
  activeFilters: string[];
}

export function ValuesPreferenceSidebar({ onFiltersChange, activeFilters }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load saved preferences
  const { data: savedPrefs } = useQuery({
    queryKey: ["values-preferences", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_values_preferences")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleToggle = async (category: string, enabled: boolean) => {
    const newFilters = enabled
      ? [...activeFilters, category]
      : activeFilters.filter((f) => f !== category);
    onFiltersChange(newFilters);

    // Persist if logged in
    if (user) {
      try {
        if (enabled) {
          await supabase.from("user_values_preferences").upsert({
            user_id: user.id,
            value_category: category,
            is_positive: true,
          }, { onConflict: "user_id,value_category" });
        } else {
          await supabase.from("user_values_preferences")
            .delete()
            .eq("user_id", user.id)
            .eq("value_category", category);
        }
        queryClient.invalidateQueries({ queryKey: ["values-preferences"] });
      } catch {
        // Silently fail persistence—filter still works locally
      }
    }
  };

  // Initialize from saved prefs on first load
  useState(() => {
    if (savedPrefs && savedPrefs.length > 0 && activeFilters.length === 0) {
      const saved = savedPrefs.map((p: any) => p.value_category);
      onFiltersChange(saved);
    }
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Values Filter
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Toggle to filter companies by detected value signals.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {VALUE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeFilters.includes(cat.key);
          return (
            <div
              key={cat.key}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${cat.color}`} />
                <span className="text-xs text-foreground truncate">{cat.label}</span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => handleToggle(cat.key, checked)}
                className="shrink-0"
              />
            </div>
          );
        })}
        {activeFilters.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {activeFilters.map((f) => {
                const cat = VALUE_CATEGORIES.find((c) => c.key === f);
                return cat ? (
                  <Badge key={f} variant="secondary" className="text-[10px]">{cat.label}</Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
        {!user && (
          <p className="text-[10px] text-muted-foreground italic pt-1">
            Log in to save your preferences across sessions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
