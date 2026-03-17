import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquarePlus, Send, X, Star, Sparkles, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { STRIPE_TIERS } from "@/hooks/use-premium";

const FEEDBACK_TYPES = [
  { value: "love", label: "❤️ Love it" },
  { value: "bug", label: "🐛 Bug" },
  { value: "idea", label: "💡 Idea" },
  { value: "confusing", label: "😕 Confusing" },
];

export function BetaFeedbackWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wantReal, setWantReal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("beta_feedback").insert({
        user_id: user.id,
        user_email: user.email,
        page_url: location.pathname,
        feedback_type: wantReal ? "subscribe_intent" : feedbackType,
        message: message.trim() + (wantReal ? " [WANTS TO SUBSCRIBE]" : ""),
        rating,
      });
      if (error) throw error;

      // If they want to subscribe, also capture in email_signups
      if (wantReal && user.email) {
        await (supabase as any).from("email_signups").upsert(
          { email: user.email, source: "beta_subscribe_intent" },
          { onConflict: "email" }
        );
      }

      toast({ title: "Thanks for your feedback! 🙏", description: "Jackye will review it personally." });
      
      if (wantReal) {
        setSubmitted(true);
      } else {
        setMessage("");
        setRating(null);
        setFeedbackType("general");
        setOpen(false);
      }
    } catch {
      toast({ title: "Couldn't send feedback", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast({ title: "Checkout failed", description: "Try again or visit the pricing page.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSubmitted(false);
    setWantReal(false);
    setMessage("");
    setRating(null);
    setFeedbackType("general");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-4 z-50 w-[340px] bg-card border border-border rounded-2xl shadow-elevated p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm font-display">Beta Feedback</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post-subscribe-intent: conversion CTA */}
            {submitted && wantReal ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground font-display">
                    Ready to lock it in?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your beta access stays active until launch. Subscribe now to lock in your current rate — pricing increases at GA.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckout(STRIPE_TIERS.candidate.price_id)}
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-left group"
                  >
                    <div>
                      <span className="text-sm font-semibold text-foreground block">Candidate</span>
                      <span className="text-[11px] text-muted-foreground font-mono">10 scans · 5 offer checks · all layers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-foreground">$29</span>
                      <span className="text-[10px] text-muted-foreground">/mo</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCheckout(STRIPE_TIERS.professional.price_id)}
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-all text-left"
                  >
                    <div>
                      <span className="text-sm font-semibold text-foreground block">Professional</span>
                      <span className="text-[11px] text-muted-foreground font-mono">50 scans · dossier export · EVP audit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-foreground">$99</span>
                      <span className="text-[10px] text-muted-foreground">/mo</span>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="flex-1 text-xs text-muted-foreground"
                  >
                    Not yet — I'll keep testing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { handleClose(); navigate("/pricing"); }}
                    className="flex-1 text-xs gap-1"
                  >
                    See all plans <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Your intent has been recorded. We'll notify you at launch either way.
                </p>
              </motion.div>
            ) : (
              <>
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

                <div className={`border rounded-lg p-2.5 space-y-1.5 transition-colors ${
                  wantReal ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border/50"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="wantReal"
                      checked={wantReal}
                      onChange={(e) => setWantReal(e.target.checked)}
                      className="rounded border-border accent-[hsl(var(--primary))]"
                    />
                    <label htmlFor="wantReal" className="text-xs text-foreground cursor-pointer font-medium">
                      I'd subscribe when this launches 🚀
                    </label>
                  </div>
                  {wantReal && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-primary pl-5 leading-relaxed"
                    >
                      After submitting, we'll show you early-bird pricing — you can lock in your rate today.
                    </motion.p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  size="sm"
                  className="w-full gap-1.5"
                >
                  {wantReal ? <CreditCard className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  {submitting ? "Sending..." : wantReal ? "Send & Show Me Plans" : "Send Feedback"}
                </Button>

                <p className="text-[10px] text-muted-foreground text-center font-mono">
                  Page: {location.pathname}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
        aria-label="Send feedback"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
      </motion.button>
    </>
  );
}
