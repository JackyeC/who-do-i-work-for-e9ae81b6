import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WORK_STYLES = [
  "Independent", "Collaborative", "Structured", "Flexible",
  "Fast-paced", "Methodical", "Creative", "Analytical",
];

const STRENGTHS = [
  "Communication", "Problem Solving", "Leadership", "Detail-Oriented",
  "Strategic Thinking", "Empathy", "Technical Skills", "Adaptability",
  "Project Management", "Negotiation", "Mentoring", "Innovation",
];

const PERSONALITY_TRAITS = [
  "Introverted", "Extroverted", "Risk-Taker", "Cautious",
  "Big-Picture", "Detail-Focused", "People-Oriented", "Task-Oriented",
];

const COMM_STYLES = ["Direct", "Diplomatic", "Collaborative", "Analytical"];
const LEADERSHIP_PREFS = ["Lead from front", "Supportive coach", "Behind the scenes", "Not interested in leading"];
const WORK_ENVS = ["Remote", "In-office", "Hybrid", "Flexible/No preference"];

export function PersonalityProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workStyles, setWorkStyles] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [commStyle, setCommStyle] = useState<string>("");
  const [leadershipPref, setLeadershipPref] = useState<string>("");
  const [workEnv, setWorkEnv] = useState<string>("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["personality-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_personality_profile")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setWorkStyles(profile.work_style || []);
      setStrengths(profile.strengths || []);
      setTraits(profile.personality_traits || []);
      setCommStyle(profile.communication_style || "");
      setLeadershipPref(profile.leadership_preference || "");
      setWorkEnv(profile.work_environment || "");
    }
  }, [profile]);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void, max = 4) => {
    if (list.includes(item)) setter(list.filter(i => i !== item));
    else if (list.length < max) setter([...list, item]);
    else toast.info(`Pick up to ${max}`);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        work_style: workStyles,
        strengths,
        personality_traits: traits,
        communication_style: commStyle || null,
        leadership_preference: leadershipPref || null,
        work_environment: workEnv || null,
      };
      const { error } = await (supabase as any)
        .from("user_personality_profile")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personality-profile"] });
      toast.success("Personality profile saved!");
    },
    onError: () => toast.error("Failed to save"),
  });

  const isComplete = workStyles.length > 0 && strengths.length > 0;

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>;
  }

  const ChipSelector = ({ label, items, selected, onToggle, max = 4 }: {
    label: string; items: string[]; selected: string[];
    onToggle: (item: string) => void; max?: number;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label} <span className="text-xs text-muted-foreground">(pick up to {max})</span></p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              selected.includes(item)
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground border-border hover:border-primary/40"
            )}
          >
            {selected.includes(item) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const SingleSelector = ({ label, items, selected, onSelect }: {
    label: string; items: string[]; selected: string;
    onSelect: (item: string) => void;
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            onClick={() => onSelect(item === selected ? "" : item)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              selected === item
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground border-border hover:border-primary/40"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Work Style & Personality</CardTitle>
        </div>
        <CardDescription>
          Tell us how you work best. This helps AI recommend roles and environments that fit you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChipSelector
          label="How do you prefer to work?"
          items={WORK_STYLES}
          selected={workStyles}
          onToggle={(item) => toggleItem(workStyles, item, setWorkStyles)}
        />

        <ChipSelector
          label="What are your top strengths?"
          items={STRENGTHS}
          selected={strengths}
          onToggle={(item) => toggleItem(strengths, item, setStrengths)}
        />

        <ChipSelector
          label="Personality traits"
          items={PERSONALITY_TRAITS}
          selected={traits}
          onToggle={(item) => toggleItem(traits, item, setTraits, 3)}
          max={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SingleSelector
            label="Communication style"
            items={COMM_STYLES}
            selected={commStyle}
            onSelect={setCommStyle}
          />
          <SingleSelector
            label="Leadership preference"
            items={LEADERSHIP_PREFS}
            selected={leadershipPref}
            onSelect={setLeadershipPref}
          />
          <SingleSelector
            label="Work environment"
            items={WORK_ENVS}
            selected={workEnv}
            onSelect={setWorkEnv}
          />
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Personality Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
