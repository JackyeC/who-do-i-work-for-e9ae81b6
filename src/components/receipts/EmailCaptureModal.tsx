import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
}

export function EmailCaptureModal({ open, onClose, onUnlocked }: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitting(true);
    try {
      await supabase.from("career_waitlist").insert({ email, reason: "heat_map_signup" });
      toast.success("You're in. Welcome to the heat map.");
      onUnlocked?.();
      onClose();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-[400px] mx-4 shadow-2xl animate-fade-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-primary mb-3">
          🔥 Join the Heat Map
        </p>
        <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">
          They thought we wouldn't find out.
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Get the receipts before they get deleted. One email. Zero spam.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "..." : "In"}
          </button>
        </form>

        <div className="flex justify-end mt-5">
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "hsl(var(--muted-foreground))", fontWeight: 300, opacity: 0.6 }}>
            JRC EDIT
          </span>
        </div>
      </div>
    </div>
  );
}
