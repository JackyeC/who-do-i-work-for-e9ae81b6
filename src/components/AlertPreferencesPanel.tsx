import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings2, Bell, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SIGNAL_CATEGORIES = [
  { key: "political_spending", label: "Political Spending", desc: "PAC donations, lobbying changes" },
  { key: "hiring_technology", label: "Hiring Technology", desc: "New AI hiring tools detected" },
  { key: "worker_sentiment", label: "Worker Sentiment", desc: "Rating changes, new complaints" },
  { key: "compensation", label: "Compensation", desc: "Pay equity, salary range updates" },
  { key: "benefits", label: "Worker Benefits", desc: "Benefits changes, policy updates" },
  { key: "ideology", label: "Ideology Flags", desc: "New controversial affiliations" },
  { key: "warn_notices", label: "WARN Notices", desc: "Layoff and closure alerts" },
  { key: "contracts", label: "Gov Contracts", desc: "New contract awards or changes" },
];

interface AlertPreferencesPanelProps {
  watchId: string;
  companyName: string;
  currentPreferences: any;
}

export function AlertPreferencesPanel({ watchId, companyName, currentPreferences }: AlertPreferencesPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prefs = currentPreferences || { categories: SIGNAL_CATEGORIES.map(c => c.key), email: false };
  const [categories, setCategories] = useState<string[]>(prefs.categories || SIGNAL_CATEGORIES.map(c => c.key));
  const [emailEnabled, setEmailEnabled] = useState(prefs.email || false);
  const [saving, setSaving] = useState(false);

  const save = async (newCategories: string[], newEmail: boolean) => {
    setSaving(true);
    const newPrefs = { categories: newCategories, email: newEmail };
    await supabase
      .from("user_company_watchlist")
      .update({ notification_preferences: newPrefs })
      .eq("id", watchId);
    queryClient.invalidateQueries({ queryKey: ["my-watchlist"] });
    setSaving(false);
    toast({ title: "Preferences saved", description: `Alert settings updated for ${companyName}.` });
  };

  const toggleCategory = (key: string) => {
    const next = categories.includes(key)
      ? categories.filter(c => c !== key)
      : [...categories, key];
    setCategories(next);
    save(next, emailEnabled);
  };

  const toggleEmail = () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    save(categories, next);
  };

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-border/60">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Alert Preferences</span>
      </div>

      {/* Email toggle */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground cursor-pointer">Email notifications</Label>
        </div>
        <Switch checked={emailEnabled} onCheckedChange={toggleEmail} disabled={saving} />
      </div>

      {/* Category toggles */}
      <div className="grid grid-cols-2 gap-1.5">
        {SIGNAL_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => toggleCategory(cat.key)}
            className={`text-left p-2 rounded-lg border text-xs transition-colors ${
              categories.includes(cat.key)
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-muted/20 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="font-medium">{cat.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
