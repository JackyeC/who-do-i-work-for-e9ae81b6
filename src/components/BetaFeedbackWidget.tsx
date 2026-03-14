import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { MessageSquarePlus, Send, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const FEEDBACK_TYPES = [
  { value: "love", label: "❤️ Love it" },
  { value: "bug", label: "🐛 Bug" },
  { value: "idea", label: "💡 Idea" },
  { value: "confusing", label: "😕 Confusing" },
];

export function BetaFeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wantReal, setWantReal] = useState(false);
  if (!user) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("beta_feedback").insert({
        user_id: user.id,
        user_email: user.email,
        page_url: location.pathname,
        feedback_type: feedbackType,
        message: message.trim() + (wantReal ? " [WANTS TO SUBSCRIBE]" : ""),
        rating,
      });
      if (error) throw error;

      // If they want to subscribe, also capture in email_signups
      if (wantReal && user.email) {
        await (supabase as any).from("email_signups").upsert(
          { email: user.email, source: "beta_interest" },
          { onConflict: "email" }
        );
      }

      toast({ title: "Thanks for your feedback! 🙏", description: "Jackye will review it personally." });
      setMessage("");
      setRating(null);
      setFeedbackType("general");
      setWantReal(false);
      setOpen(false);
    } catch {
      toast({ title: "Couldn't send feedback", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] bg-card border border-border rounded-2xl shadow-elevated p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Beta Feedback</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFeedbackType(t.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                    feedbackType === t.value
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind? Bugs, ideas, things you love..."
              className="min-h-[80px] text-sm resize-none"
              maxLength={1000}
            />

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Rate:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-0.5">
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      rating && s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="bg-muted/50 border border-border/50 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="wantReal"
                  checked={wantReal}
                  onChange={(e) => setWantReal(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="wantReal" className="text-xs text-foreground cursor-pointer">
                  I'd subscribe when this launches for real 🚀
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              size="sm"
              className="w-full gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Page: {location.pathname}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
        aria-label="Send feedback"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
      </motion.button>
    </>
  );
}
