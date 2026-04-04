import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getViteSupabaseUrl } from "@/lib/supabase-vite-env";

interface EvidenceLogFormProps {
  onSaved: () => void;
}

export function EvidenceLogForm({ onSaved }: EvidenceLogFormProps) {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [quote, setQuote] = useState("");
  const [policy, setPolicy] = useState("");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewritten, setRewritten] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    if (!quote.trim()) {
      toast.error("Verbatim quote is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("personal_work_logs").insert({
        user_id: user.id,
        incident_date: format(date, "yyyy-MM-dd"),
        incident_time: time || null,
        participants: participants.trim(),
        verbatim_quote: quote.trim(),
        related_policy: policy.trim(),
        original_text: rewritten ? quote.trim() : null,
        rewritten_text: rewritten || null,
      });
      if (error) throw error;
      toast.success("Incident logged.");
      setQuote("");
      setParticipants("");
      setPolicy("");
      setTime("");
      setRewritten(null);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmotion = async () => {
    if (!quote.trim()) {
      toast.error("Write your account first, then remove emotion.");
      return;
    }
    setRewriting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(`${getViteSupabaseUrl()}/functions/v1/rewrite-evidence-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ text: quote }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Rewrite failed" }));
        throw new Error(err.error || "Rewrite failed");
      }
      const data = await resp.json();
      setRewritten(data.rewritten);
    } catch (e: any) {
      toast.error(e.message || "Rewrite failed.");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div className="border border-border/40 bg-card p-6 space-y-4">
      {/* Date + Time row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !date && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Time (optional)</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-sm" />
        </div>
      </div>

      {/* Participants */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Participants</label>
        <Input
          placeholder="Names and titles of people involved"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Verbatim Quote */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Verbatim Account</label>
        <Textarea
          placeholder="What happened? What was said? Be as specific and literal as possible."
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={5}
          className="text-sm"
        />
      </div>

      {/* Remove Emotion */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleRemoveEmotion}
        disabled={rewriting || !quote.trim()}
        className="gap-1.5 text-xs font-semibold"
      >
        {rewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />}
        Remove Emotion
      </Button>

      {/* Rewritten version */}
      {rewritten && (
        <div className="border border-primary/20 bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">Evidence-Based Version</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rewritten}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setQuote(rewritten); setRewritten(null); }}>
              Use this version
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setRewritten(null)}>
              Keep original
            </Button>
          </div>
        </div>
      )}

      {/* Related Policy */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Related Policy (optional)</label>
        <Input
          placeholder="Company policy relevant to this incident"
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || !quote.trim()} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Log This Incident
      </Button>
    </div>
  );
}
