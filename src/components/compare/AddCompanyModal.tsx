import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Building2, Loader2, Sparkles } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC"
];

const INDUSTRIES = [
  "Technology","Healthcare","Finance","Energy","Retail","Manufacturing",
  "Telecommunications","Media & Entertainment","Transportation","Agriculture",
  "Aerospace & Defense","Pharmaceuticals","Real Estate","Education",
  "Food & Beverage","Automotive","Insurance","Consulting","Other"
];

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: (company: any) => void;
  initialName?: string;
}

export function AddCompanyModal({ open, onOpenChange, onCompanyAdded, initialName = "" }: AddCompanyModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialName,
    industry: "",
    state: "",
    employee_count: "",
    website_url: "",
    ticker: "",
  });

  const slugify = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.industry || !form.state) {
      toast({ title: "Missing fields", description: "Name, industry, and state are required.", variant: "destructive" });
      return;
    }

    // Sanitize inputs
    const name = form.name.trim().slice(0, 200);
    const slug = slugify(name);

    if (slug.length < 2) {
      toast({ title: "Invalid name", description: "Company name is too short.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        toast({ title: "Already exists", description: `${existing.name} is already in the database.`, variant: "destructive" });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .insert({
          name,
          slug,
          industry: form.industry,
          state: form.state,
          employee_count: form.employee_count || null,
          website_url: form.website_url.trim() || null,
          ticker: form.ticker.trim().toUpperCase() || null,
          civic_footprint_score: 0,
          total_pac_spending: 0,
          confidence_rating: "low",
          creation_source: "user_submitted",
        })
        .select("id, name, slug, industry, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, state")
        .single();

      if (error) throw error;

      toast({ title: "Company added! 🎉", description: `${name} is now available for comparison.` });
      onCompanyAdded(data);
      onOpenChange(false);
      setForm({ name: "", industry: "", state: "", employee_count: "", website_url: "", ticker: "" });
    } catch (err: any) {
      console.error("Add company error:", err);
      toast({ title: "Error", description: err.message || "Failed to add company.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            Add a Company
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Required */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="font-mono text-sm"
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                Industry <span className="text-destructive">*</span>
              </Label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                State <span className="text-destructive">*</span>
              </Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional extended */}
          <div className="border-t border-border pt-4 mt-4">
            <div className="font-mono text-[8px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Optional Details
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-mono text-[9px] text-muted-foreground">Employees</Label>
                <Input
                  value={form.employee_count}
                  onChange={(e) => setForm({ ...form, employee_count: e.target.value })}
                  placeholder="e.g. 10,000"
                  className="font-mono text-xs"
                  maxLength={50}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-mono text-[9px] text-muted-foreground">Website</Label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="example.com"
                  className="font-mono text-xs"
                  maxLength={500}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-mono text-[9px] text-muted-foreground">Ticker</Label>
                <Input
                  value={form.ticker}
                  onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                  placeholder="ACME"
                  className="font-mono text-xs"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full font-mono text-xs tracking-wider uppercase">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Adding..." : "Add Company & Compare"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
