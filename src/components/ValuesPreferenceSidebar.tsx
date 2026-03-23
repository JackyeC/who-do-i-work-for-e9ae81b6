import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { VALUES_LENSES, VALUES_GROUPS } from "@/lib/valuesLenses";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  onFiltersChange: (filters: string[]) => void;
  activeFilters: string[];
}

export function ValuesPreferenceSidebar({ onFiltersChange, activeFilters }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
        // Silently fail persistence
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

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Values Filter
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Toggle to filter jobs by company value signals.
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {VALUES_GROUPS.map((group) => {
          const groupLenses = VALUES_LENSES.filter(l => l.group === group.key);
          const activeInGroup = groupLenses.filter(l => activeFilters.includes(l.key)).length;
          const isOpen = openGroups[group.key] ?? false;

          return (
            <Collapsible key={group.key} open={isOpen} onOpenChange={() => toggleGroup(group.key)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-1.5">
                  {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-xs font-medium text-foreground">{group.label}</span>
                </div>
                {activeInGroup > 0 && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5">{activeInGroup}</Badge>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 pl-2">
                {groupLenses.map((lens) => {
                  const Icon = lens.icon;
                  const isActive = activeFilters.includes(lens.key);
                  return (
                    <div
                      key={lens.key}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="text-xs text-foreground truncate">{lens.label}</span>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => handleToggle(lens.key, checked)}
                        className="shrink-0"
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        {activeFilters.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {activeFilters.map((f) => {
                const lens = VALUES_LENSES.find((l) => l.key === f);
                return lens ? (
                  <Badge key={f} variant="secondary" className="text-xs">{lens.label}</Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
        {!user && (
          <p className="text-xs text-muted-foreground italic pt-1">
            Log in to save your preferences across sessions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
