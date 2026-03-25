import { useState, useEffect } from "react";
import { useAutoApplySettings } from "@/hooks/use-auto-apply";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Zap, Pause, Play, Settings, CheckCircle2,
  ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SCORE_TIERS = [
  { min: 40, max: 54, label: "Wide net", color: "text-civic-yellow", bg: "bg-civic-yellow/10 border-civic-yellow/20", bar: "bg-civic-yellow" },
  { min: 55, max: 64, label: "Some alignment", color: "text-civic-yellow", bg: "bg-civic-yellow/10 border-civic-yellow/20", bar: "bg-civic-yellow" },
  { min: 65, max: 74, label: "Strong match", color: "text-primary", bg: "bg-primary/10 border-primary/20", bar: "bg-primary" },
  { min: 75, max: 84, label: "Very selective", color: "text-civic-green", bg: "bg-civic-green/10 border-civic-green/20", bar: "bg-civic-green" },
  { min: 85, max: 100, label: "Best only", color: "text-civic-green", bg: "bg-civic-green/10 border-civic-green/20", bar: "bg-civic-green" },
];

function getTier(threshold: number) {
  return SCORE_TIERS.find(t => threshold >= t.min && threshold <= t.max) || SCORE_TIERS[2];
}

export function AutoApplySettings() {
  const { settings, isLoading, upsert } = useAutoApplySettings();
  const [threshold, setThreshold] = useState(70);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (settings) {
      setThreshold(settings.min_alignment_threshold);
      setDailyLimit(settings.max_daily_applications);
      setEnabled(settings.is_enabled);
      setPaused(settings.is_paused);
    }
  }, [settings]);

  const handleSave = () => {
    upsert.mutate({
      is_enabled: enabled,
      min_alignment_threshold: threshold,
      max_daily_applications: dailyLimit,
      is_paused: paused,
    });
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    upsert.mutate({ is_paused: next });
  };

  const tier = getTier(threshold);
  const hasChanges = settings && (
    threshold !== settings.min_alignment_threshold ||
    dailyLimit !== settings.max_daily_applications ||
    enabled !== settings.is_enabled
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  return (
    <Card className="overflow-hidden">
      {/* Compact header with status */}
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Auto-Apply</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                AI-generated applications for values-aligned jobs
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={paused ? "secondary" : enabled ? "default" : "outline"}
              className="text-xs font-medium"
            >
              {paused ? "Paused" : enabled ? "Active" : "Off"}
            </Badge>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Threshold — the star of the show */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Minimum Match
            </Label>
            <span className={cn("text-lg font-bold tabular-nums", tier.color)}>{threshold}%</span>
          </div>
          
          <Slider
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            min={40}
            max={100}
            step={5}
            className="py-1"
          />

          {/* Tier indicator strip */}
          <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
            {SCORE_TIERS.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-opacity duration-200",
                  t.bar,
                  threshold >= t.min ? "opacity-100" : "opacity-20"
                )}
              />
            ))}
          </div>

          <motion.div
            key={tier.label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("px-3 py-2 rounded-md border text-xs", tier.bg)}
          >
            <span className={cn("font-semibold", tier.color)}>{tier.label}</span>
            <span className="text-muted-foreground ml-1.5">— {threshold}% values alignment required</span>
          </motion.div>
        </div>

        {/* Daily limit — compact inline */}
        <div className="flex items-center justify-between gap-4 py-3 border-t border-border">
          <div>
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              Daily Limit
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">Max applications per day</p>
          </div>
          <Input
            type="number"
            min={1}
            max={25}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Math.max(1, Math.min(25, Number(e.target.value))))}
            className="w-16 h-8 text-center text-sm font-medium"
          />
        </div>

        {/* How it works — collapsible */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            How does this work?
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { n: "1", t: "We scan jobs daily from tracked companies" },
                      { n: "2", t: "Each job scored against your values profile" },
                      { n: "3", t: "AI writes a tailored cover letter" },
                      { n: "4", t: "You review before anything is sent" },
                    ].map(s => (
                      <div key={s.n} className="flex items-start gap-2 p-2 rounded-md bg-muted/50 border border-border">
                        <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                        <span className="leading-relaxed">{s.t}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed p-2 bg-primary/5 rounded-md border border-primary/10">
                    <strong className="text-foreground">🔒 You stay in control.</strong> Nothing is submitted without you clicking "Apply."
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={upsert.isPending || !hasChanges}
            size="sm"
            className="gap-1.5 flex-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {hasChanges ? "Save Changes" : "Saved"}
          </Button>
          <Button
            onClick={togglePause}
            variant={paused ? "default" : "secondary"}
            size="sm"
            className="gap-1.5"
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
