import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Compass, Bot, Target, Users, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tracks = [
  {
    number: 1,
    name: "The Explorer",
    icon: Compass,
    price: "Free",
    priceNote: "Registration required",
    period: "",
    mode: "free" as const,
    hook: "Start for Free.",
    description: "Calibrate your DNA and join 1,000+ career researchers for weekly clarity.",
    action: "Unlock DNA Calibration",
    features: [
      "Workplace DNA Calibration results",
      "Public Intelligence Dashboard access",
      "Monday Momentum newsletter",
      "Follow Jackye on LinkedIn & YouTube",
    ],
  },
  {
    number: 2,
    name: "The Scout",
    icon: Bot,
    price: "$19",
    priceNote: "",
    period: "/mo",
    mode: "subscription" as const,
    priceId: "price_scout_monthly", // placeholder — will be replaced with real Stripe price
    hook: "Your AI Coach.",
    description: "24/7 values-audit of any job link. Know before you apply.",
    action: "Activate AI Coach",
    features: [
      "Unlimited AI job-link audits",
      "Values alignment scoring",
      "Real-time signal alerts",
      "Ask Jackye — unlimited questions",
    ],
  },
  {
    number: 3,
    name: "The Strategist",
    icon: Target,
    price: "$149",
    priceNote: "",
    period: " one-time",
    mode: "payment" as const,
    priceId: "price_strategist_onetime", // placeholder
    hook: "The Audit.",
    description: "Deep-dive dossier for one specific interview. Walk in prepared.",
    action: "Get My Dossier",
    popular: true,
    features: [
      "Full employer intelligence dossier",
      "Negotiation talking points",
      "Compensation benchmarks (BLS)",
      "Interview intelligence brief",
    ],
  },
  {
    number: 4,
    name: "The Partner",
    icon: Users,
    price: "$299",
    priceNote: "",
    period: " one-time",
    mode: "payment" as const,
    priceId: "price_partner_onetime", // placeholder
    hook: "The Session.",
    description: "45-min 1-on-1 strategy session with Jackye Clayton.",
    action: "Book Your Session",
    features: [
      "45-minute 1-on-1 with Jackye",
      "Personalized career strategy",
      "Offer negotiation coaching",
      "Post-session action plan",
    ],
  },
  {
    number: 5,
    name: "The Executive",
    icon: Rocket,
    price: "$999",
    priceNote: "",
    period: "/year",
    mode: "subscription" as const,
    priceId: "price_executive_annual", // placeholder
    hook: "The Autopilot.",
    description: "Full search management + Priority access. Your career, on cruise control.",
    action: "Go Executive",
    features: [
      "Purple Squirrel Auto-Apply engine",
      "Full career mapping & 5-year plan",
      "Priority 1-on-1 access to Jackye",
      "All Scout + Strategist features",
    ],
  },
];

export function PathfinderTracks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleTrackAction = async (track: typeof tracks[0]) => {
    if (track.mode === "free") {
      if (user) {
        navigate("/welcome");
      } else {
        navigate("/login?beta=false");
      }
      return;
    }

    if (!user) {
      toast.error("Sign in first to continue.", {
        action: { label: "Sign in", onClick: () => navigate("/login") },
      });
      return;
    }

    if (track.name === "The Partner") {
      navigate("/work-with-jackye");
      return;
    }

    setLoading(track.priceId || null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: track.priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="px-6 lg:px-16 py-24 lg:py-32">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <div className="font-mono text-sm tracking-[0.2em] uppercase text-primary mb-3">
            Your Pathfinder
          </div>
          <h2 className="text-2xl lg:text-3xl text-foreground mb-3">
            Choose Your Track
          </h2>
          <p className="text-sm text-muted-foreground max-w-[520px] mx-auto">
            From free career calibration to full autopilot search management. Start where you are.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px bg-border border border-border">
          {tracks.map((track) => (
            <div
              key={track.number}
              className={cn(
                "bg-card p-6 lg:p-7 flex flex-col relative",
                track.popular && "ring-2 ring-primary ring-inset"
              )}
            >
              {track.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center font-mono text-[10px] tracking-[0.2em] uppercase py-1">
                  Most Popular
                </div>
              )}

              <div className={cn("mb-4", track.popular && "mt-4")}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Track {track.number}
                  </span>
                </div>
                <track.icon className="w-6 h-6 text-primary mb-3" strokeWidth={1.5} />
                <div className="font-mono text-sm tracking-wider uppercase text-foreground font-semibold mb-1">
                  {track.name}
                </div>
                <div className="font-mono text-xs tracking-wider uppercase text-primary mb-1">
                  {track.hook}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">{track.price}</span>
                {track.period && (
                  <span className="text-sm text-muted-foreground">{track.period}</span>
                )}
                {track.priceNote && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">{track.priceNote}</div>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-grow">
                {track.description}
              </p>

              <ul className="space-y-2 mb-6">
                {track.features.map((f) => (
                  <li key={f} className="text-sm text-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleTrackAction(track)}
                variant={track.popular ? "default" : "outline"}
                className="w-full gap-1.5 font-mono text-xs tracking-wider uppercase mt-auto"
                disabled={loading === track.priceId}
              >
                {track.action}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
