import { useState, useEffect } from "react";
import { useJobPreferences, type JobPreferences } from "@/hooks/use-job-preferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings2, MapPin, DollarSign, Briefcase, ShieldAlert, ChevronDown, Loader2 } from "lucide-react";

const REMOTE_OPTIONS = [
  { value: "remote_only", label: "Remote only" },
  { value: "hybrid_ok", label: "Hybrid OK" },
  { value: "onsite_ok", label: "On-site OK" },
] as const;

const URGENCY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "active", label: "Active" },
  { value: "exploring", label: "Exploring" },
  { value: "passive", label: "Passive" },
] as const;

const TRAVEL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
] as const;

interface Props {
  onClose?: () => void;
}

export function JobPreferencesForm({ onClose }: Props) {
  const { preferences, isLoading, savePreferences, isSaving } = useJobPreferences();
  const [form, setForm] = useState<JobPreferences>(preferences);
  const [locationInput, setLocationInput] = useState("");
  const [dealbreakerInput, setDealbreakerInput] = useState("");

  useEffect(() => {
    if (preferences) setForm(preferences);
  }, [preferences]);

  const update = <K extends keyof JobPreferences>(key: K, val: JobPreferences[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const { id, ...rest } = form as any;
    savePreferences(rest);
    onClose?.();
  };

  const addLocation = () => {
    const v = locationInput.trim();
    if (v && !form.preferred_locations.includes(v)) {
      update("preferred_locations", [...form.preferred_locations, v]);
      setLocationInput("");
    }
  };

  const addDealbreaker = () => {
    const v = dealbreakerInput.trim();
    if (v && !form.dealbreakers.includes(v)) {
      update("dealbreakers", [...form.dealbreakers, v]);
      setDealbreakerInput("");
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl border-border/40">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" /> Job Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location & Remote
            <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Remote Preference</Label>
              <div className="flex gap-1.5 mt-1">
                {REMOTE_OPTIONS.map((o) => (
                  <Badge
                    key={o.value}
                    variant={form.remote_preference === o.value ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => update("remote_preference", o.value)}
                  >
                    {o.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preferred Locations</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. New York"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                />
                <Button size="sm" variant="outline" onClick={addLocation} className="h-8 text-xs">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.preferred_locations.map((l) => (
                  <Badge key={l} variant="secondary" className="text-xs gap-1">
                    {l}
                    <button onClick={() => update("preferred_locations", form.preferred_locations.filter((x) => x !== l))} className="hover:text-destructive">×</button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Open to relocation</Label>
              <Switch checked={form.willing_to_relocate} onCheckedChange={(v) => update("willing_to_relocate", v)} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Compensation */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Compensation
            <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Minimum ($)</Label>
                <Input
                  type="number"
                  value={form.minimum_compensation ?? ""}
                  onChange={(e) => update("minimum_compensation", e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 80000"
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Target ($)</Label>
                <Input
                  type="number"
                  value={form.target_compensation ?? ""}
                  onChange={(e) => update("target_compensation", e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 120000"
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Role */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Role & Search
            <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Search Urgency</Label>
              <div className="flex gap-1.5 mt-1">
                {URGENCY_OPTIONS.map((o) => (
                  <Badge
                    key={o.value}
                    variant={form.search_urgency === o.value ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => update("search_urgency", o.value)}
                  >
                    {o.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Travel Tolerance</Label>
              <div className="flex gap-1.5 mt-1">
                {TRAVEL_OPTIONS.map((o) => (
                  <Badge
                    key={o.value}
                    variant={form.travel_tolerance === o.value ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => update("travel_tolerance", o.value)}
                  >
                    {o.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Sponsorship required</Label>
              <Switch checked={form.sponsorship_required} onCheckedChange={(v) => update("sponsorship_required", v)} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dealbreakers */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
            <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" /> Dealbreakers
            <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={dealbreakerInput}
                onChange={(e) => setDealbreakerInput(e.target.value)}
                placeholder="e.g. Non-compete clause"
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDealbreaker())}
              />
              <Button size="sm" variant="outline" onClick={addDealbreaker} className="h-8 text-xs">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.dealbreakers.map((d) => (
                <Badge key={d} variant="secondary" className="text-xs gap-1">
                  {d}
                  <button onClick={() => update("dealbreakers", form.dealbreakers.filter((x) => x !== d))} className="hover:text-destructive">×</button>
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
