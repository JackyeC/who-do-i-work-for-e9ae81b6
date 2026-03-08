import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, X, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SIGNAL_CATEGORIES = [
  "Hiring Technology",
  "Worker Benefits",
  "Compensation Transparency",
  "Worker Sentiment",
  "Labor Controversy",
  "Racial Discrimination",
  "Mass Layoffs",
  "Executive Controversy",
  "DEI Rollback",
  "Union Activity",
  "Government Influence",
  "EEOC/NLRB Action",
  "Civic Influence",
  "Ideology Flag",
  "Other",
];

const CONFIDENCE_LEVELS = [
  { value: "direct_source", label: "Direct Source" },
  { value: "strong_inference", label: "Multi-Source Signal" },
  { value: "moderate_inference", label: "Inferred Signal" },
];

interface ManualSignalEntryProps {
  companyId: string;
  companyName: string;
  onSignalAdded?: () => void;
}

export function ManualSignalEntry({ companyId, companyName, onSignalAdded }: ManualSignalEntryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    signal_category: "",
    signal_type: "",
    signal_value: "",
    confidence_level: "strong_inference",
    source_url: "",
    raw_excerpt: "",
  });

  // Only show for logged-in users (admin check could be added later)
  if (!user) return null;

  const handleSubmit = async () => {
    if (!form.signal_category || !form.signal_type) {
      toast({ title: "Missing fields", description: "Category and signal type are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("company_signal_scans").insert({
        company_id: companyId,
        signal_category: form.signal_category,
        signal_type: form.signal_type,
        signal_value: form.signal_value || null,
        confidence_level: form.confidence_level,
        source_url: form.source_url || null,
        raw_excerpt: form.raw_excerpt || null,
      });

      if (error) throw error;

      toast({ title: "Signal added", description: `Manual signal recorded for ${companyName}.` });
      setForm({ signal_category: "", signal_type: "", signal_value: "", confidence_level: "strong_inference", source_url: "", raw_excerpt: "" });
      setIsOpen(false);
      onSignalAdded?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save signal.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        Add Manual Signal
      </Button>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            Add Verified Signal
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Add a signal from a verified public source. Include the source URL for transparency.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category *</label>
            <Select value={form.signal_category} onValueChange={(v) => setForm({ ...form, signal_category: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SIGNAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Confidence</label>
            <Select value={form.confidence_level} onValueChange={(v) => setForm({ ...form, confidence_level: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENCE_LEVELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Signal Type *</label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. EEOC racial discrimination lawsuit, Mass layoffs of 1,200 workers"
            value={form.signal_type}
            onChange={(e) => setForm({ ...form, signal_type: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Signal Value / Summary</label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. $3.2M settlement, 14,000 workers affected"
            value={form.signal_value}
            onChange={(e) => setForm({ ...form, signal_value: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Source URL</label>
          <Input
            className="h-8 text-xs"
            placeholder="https://..."
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Evidence Excerpt</label>
          <Textarea
            className="text-xs min-h-[60px]"
            placeholder="Paste a relevant excerpt from the source..."
            value={form.raw_excerpt}
            onChange={(e) => setForm({ ...form, raw_excerpt: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Signal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
