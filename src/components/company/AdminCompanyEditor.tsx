import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Pencil, X, Save, Loader2 } from "lucide-react";

interface CompanyEditableFields {
  name: string;
  industry: string;
  state: string;
  description: string | null;
  employee_count: string | null;
  website_url: string | null;
  careers_url: string | null;
  parent_company: string | null;
  jackye_insight: string | null;
  ticker: string | null;
  revenue: string | null;
  founded_year: number | null;
}

interface AdminCompanyEditorProps {
  companyId: string;
  companySlug: string;
  currentData: CompanyEditableFields;
  onClose: () => void;
}

export function AdminCompanyEditor({ companyId, companySlug, currentData, onClose }: AdminCompanyEditorProps) {
  const { isAdmin, isOwner } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CompanyEditableFields>(currentData);

  if (!isAdmin && !isOwner) return null;

  const handleCancel = () => {
    setForm(currentData);
    onClose();
  };

  const handleChange = (field: keyof CompanyEditableFields, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {};
      for (const key of Object.keys(form) as (keyof CompanyEditableFields)[]) {
        const newVal = form[key];
        const oldVal = currentData[key];
        if (newVal !== oldVal) {
          updates[key] = newVal === "" ? null : newVal;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast({ title: "No changes", description: "Nothing was modified." });
        onClose();
        return;
      }

      const { error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId);

      if (error) throw error;

      toast({ title: "Company updated", description: "Changes saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["company-profile", companySlug] });
      queryClient.invalidateQueries({ queryKey: ["browse-companies"] });
      onClose();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/30 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            Edit Company Data
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs gap-1">
              <X className="w-3 h-3" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs gap-1">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Company Name</Label>
            <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Industry</Label>
            <Input value={form.industry} onChange={(e) => handleChange("industry", e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State</Label>
            <Input value={form.state} onChange={(e) => handleChange("state", e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Employee Count</Label>
            <Input value={form.employee_count || ""} onChange={(e) => handleChange("employee_count", e.target.value)} className="h-8 text-sm" placeholder="e.g. 1,500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Revenue</Label>
            <Input value={form.revenue || ""} onChange={(e) => handleChange("revenue", e.target.value)} className="h-8 text-sm" placeholder="e.g. $50M" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ticker</Label>
            <Input value={form.ticker || ""} onChange={(e) => handleChange("ticker", e.target.value)} className="h-8 text-sm" placeholder="e.g. AAPL" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Founded Year</Label>
            <Input type="number" value={form.founded_year ?? ""} onChange={(e) => handleChange("founded_year", e.target.value ? Number(e.target.value) : null)} className="h-8 text-sm" placeholder="e.g. 2005" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Parent Company</Label>
            <Input value={form.parent_company || ""} onChange={(e) => handleChange("parent_company", e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Website URL</Label>
            <Input value={form.website_url || ""} onChange={(e) => handleChange("website_url", e.target.value)} className="h-8 text-sm" placeholder="https://..." />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Careers URL</Label>
            <Input value={form.careers_url || ""} onChange={(e) => handleChange("careers_url", e.target.value)} className="h-8 text-sm" placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} className="text-sm min-h-[80px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Jackye's Insight</Label>
          <Textarea value={form.jackye_insight || ""} onChange={(e) => handleChange("jackye_insight", e.target.value)} className="text-sm min-h-[80px]" placeholder="Expert analysis or editorial note…" />
        </div>
      </CardContent>
    </Card>
  );
}
