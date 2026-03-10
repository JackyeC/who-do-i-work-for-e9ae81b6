import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Sparkles, Loader2, ArrowRight, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  profileData?: {
    jobTitle?: string;
    yearsExperience?: string;
    industries?: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    values?: string[];
  };
  onComplete: (targetRole: string | null) => void;
}

interface AISuggestion {
  role: string;
  reason: string;
  growth: string;
}

export function TargetDestinationStep({ profileData, onComplete }: Props) {
  const [targetRole, setTargetRole] = useState("");
  const [skipTarget, setSkipTarget] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const handleAISuggest = async () => {
    setSkipTarget(true);
    setTargetRole("");
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("career-discovery", {
        body: {
          type: "suggest_roles",
          profile: {
            jobTitle: profileData?.jobTitle || "Professional",
            yearsExperience: profileData?.yearsExperience || "5",
            industries: profileData?.industries || [],
            technicalSkills: profileData?.technicalSkills || [],
            softSkills: profileData?.softSkills || [],
            values: profileData?.values || [],
          },
        },
      });

      if (error) throw error;

      const suggestions = data?.data?.suggestions || data?.suggestions || [];
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
      } else {
        toast.error("Couldn't generate suggestions. Try entering a role manually.");
        setSkipTarget(false);
      }
    } catch (err: any) {
      console.error("AI suggest error:", err);
      toast.error("AI suggestion failed. Try entering a role manually.");
      setSkipTarget(false);
    } finally {
      setAiLoading(false);
    }
  };

  const selectSuggestion = (role: string) => {
    setTargetRole(role);
    setSkipTarget(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Where Do You Want to Go?
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Choose a destination role, or let the AI suggest possible future roles based on your profile.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Input
              placeholder="Type your target role (e.g. VP of Engineering, Product Manager)..."
              value={targetRole}
              onChange={e => { setTargetRole(e.target.value); setSkipTarget(false); }}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleAISuggest}
              disabled={aiLoading}
              className={`flex items-center gap-3 p-3 rounded-xl border w-full text-left transition-all ${
                skipTarget ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              } ${aiLoading ? 'opacity-70 cursor-wait' : ''}`}>
              {aiLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              ) : (
                <Sparkles className={`w-4 h-4 shrink-0 ${skipTarget ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <div>
                <p className="text-sm font-medium">
                  {aiLoading ? "Analyzing your profile..." : "Let AI suggest roles for me"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {aiLoading
                    ? "Finding roles that match your skills, experience, and values"
                    : "Based on your skills, experience, and values"}
                </p>
              </div>
            </button>
          </div>

          {/* AI Loading Animation */}
          {aiLoading && (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg border border-border animate-pulse">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && !aiLoading && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                AI-suggested roles based on your profile
              </p>
              {aiSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s.role)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    targetRole === s.role
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{s.role}</span>
                    {s.growth && (
                      <Badge variant="secondary" className="text-[10px]">{s.growth}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.reason}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete(skipTarget && !targetRole ? null : targetRole)}
          disabled={!targetRole && !skipTarget}
          className="gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
