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
import { Shield, Zap, Pause, Play, Settings } from "lucide-react";

export function AutoApplySettings() {
  const { settings, isLoading, upsert } = useAutoApplySettings();
  const [threshold, setThreshold] = useState(70);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [paused, setPaused] = useState(false);

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

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Auto-Apply Guardrails
            </CardTitle>
            <CardDescription className="mt-1">
              Control how the system automatically generates application payloads for matched jobs.
            </CardDescription>
          </div>
          <Badge
            variant={paused ? "secondary" : enabled ? "default" : "outline"}
            className="text-xs"
          >
            {paused ? "Paused" : enabled ? "Active" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Auto-Apply</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically queue jobs above your alignment threshold
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Threshold slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Minimum Alignment Threshold
            </Label>
            <span className="text-sm font-semibold text-primary">{threshold}%</span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v)}
            min={40}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground">
            Only jobs scoring {threshold}%+ alignment will be auto-queued.
          </p>
        </div>

        {/* Daily limit */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Max Applications Per Day
          </Label>
          <Input
            type="number"
            min={1}
            max={25}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Math.max(1, Math.min(25, Number(e.target.value))))}
            className="w-24"
          />
          <p className="text-xs text-muted-foreground">
            System will stop after {dailyLimit} applications per day.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={upsert.isPending} size="sm">
            Save Settings
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
