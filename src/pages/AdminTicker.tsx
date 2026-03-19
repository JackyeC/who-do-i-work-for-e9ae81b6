import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pin, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

const ITEM_TYPES = [
  { value: "pac_political", label: "PAC / Political" },
  { value: "lobbying", label: "Lobbying" },
  { value: "donation", label: "Individual Donation" },
  { value: "warn_act", label: "WARN Act" },
  { value: "nlrb", label: "NLRB" },
  { value: "osha", label: "OSHA" },
  { value: "ghost_posting", label: "Ghost Posting" },
  { value: "institutional_link", label: "Institutional Link" },
  { value: "government_contract", label: "Government Contract" },
  { value: "score_update", label: "Score Update" },
  { value: "news", label: "News" },
  { value: "general", label: "General" },
];

const TYPE_COLORS: Record<string, string> = {
  pac_political: "#ff4d6d",
  lobbying: "#ff4d6d",
  donation: "#ff4d6d",
  warn_act: "#ffb347",
  nlrb: "#ffb347",
  osha: "#ffb347",
  ghost_posting: "#ffb347",
  institutional_link: "#ff6b35",
  government_contract: "#7eb8f7",
  score_update: "#f0c040",
  news: "#7a7590",
  general: "#7a7590",
};

export default function AdminTicker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState("");
  const [sourceTag, setSourceTag] = useState("");
  const [itemType, setItemType] = useState("general");
  const [isPinned, setIsPinned] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-ticker-items"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ticker_items")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("ticker_items").insert({
        company_name: companyName || null,
        message,
        source_tag: sourceTag || null,
        item_type: itemType,
        is_pinned: isPinned,
        is_manual: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticker-items"] });
      queryClient.invalidateQueries({ queryKey: ["ticker-items"] });
      setCompanyName("");
      setMessage("");
      setSourceTag("");
      setIsPinned(false);
      toast({ title: "Ticker item added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const { error } = await (supabase as any).from("ticker_items").update({ is_hidden: hidden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticker-items"] });
      queryClient.invalidateQueries({ queryKey: ["ticker-items"] });
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await (supabase as any).from("ticker_items").update({ is_pinned: pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticker-items"] });
      queryClient.invalidateQueries({ queryKey: ["ticker-items"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("ticker_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ticker-items"] });
      queryClient.invalidateQueries({ queryKey: ["ticker-items"] });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ticker Management</h1>

      {/* Add new item */}
      <div className="border border-border rounded-lg p-4 mb-8 space-y-4 bg-card">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add Ticker Item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Company Name (optional)</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Amazon" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Source Tag</Label>
            <Input value={sourceTag} onChange={e => setSourceTag(e.target.value)} placeholder="e.g. FEC, SEC, WDIWF" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Message</Label>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="$19.8M PAC spending — 72% to Republican candidates" rows={2} />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t.value] }} />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            <Label className="text-xs">Pin to top</Label>
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!message.trim() || addMutation.isPending} className="ml-auto mt-4">
            Add Item
          </Button>
        </div>
      </div>

      {/* Existing items */}
      <h2 className="text-lg font-semibold mb-3">Current Items ({items?.length ?? 0})</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {items?.map((item: any) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50"
              style={{ opacity: item.is_hidden ? 0.4 : 1, borderLeftWidth: "3px", borderLeftColor: TYPE_COLORS[item.item_type] || "#7a7590" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {item.is_pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                  {item.company_name && <span className="font-bold text-foreground">{item.company_name}:</span>}
                  <span className="text-muted-foreground truncate">{item.message}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                  <span className="uppercase">{item.item_type}</span>
                  {item.source_tag && <span>· {item.source_tag}</span>}
                  {item.is_manual && <span className="text-primary">· Manual</span>}
                  <span>· {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => togglePin.mutate({ id: item.id, pinned: !item.is_pinned })}
                  title={item.is_pinned ? "Unpin" : "Pin"}
                >
                  <Pin className="w-3.5 h-3.5" style={{ color: item.is_pinned ? "#f0c040" : undefined }} />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => toggleHidden.mutate({ id: item.id, hidden: !item.is_hidden })}
                  title={item.is_hidden ? "Show" : "Hide"}
                >
                  {item.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate(item.id)}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
          }
          {items?.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">No ticker items yet. Add one above or wait for the pipeline to generate them.</p>
          )}
        </div>
      )}
    </div>
  );
}
