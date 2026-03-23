import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Compass, Bot, Target, Rocket, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
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
    priceNote: "No credit card required",
    period: "",
    mode: "free" as const,
    hook: "Start Here.",
    description: "Calibrate your Workplace DNA and access the public intelligence dashboard. See what most job boards won't show you.",
    action: "Create Free Account",
    features: [
      "Workplace DNA Calibration results",
      "Public Intelligence Dashboard access",
      "Monday Momentum weekly newsletter",
      "Receipts — free company investigations",
      "Community access",
    ],
  },
  {
    number: 2,
    name: "Pro",
    icon: Bot,
    price: "$19",
    priceNote: "Cancel anytime",
    period: "/mo",
    mode: "subscription" as const,
    priceId: "price_1TEEvt89MyCOs8yv7SV1TeUJ",
    hook: "Your AI Coach.",
    description: "Unlimited AI-powered audits on any job link. Values alignment scoring, real-time employer alerts, and direct access to Ask Jackye.",
    action: "Go Pro",
    features: [
      "Unlimited AI job-link audits",
      "Values alignment scoring",
      "Weekly Signal Alerts (employer red flags)",
      "Ask Jackye — unlimited questions",
      "Everything in Explorer",
    ],
  },
  {
    number: 3,
    name: "The Dossier",
    icon: Target,
    price: "$199",
    priceNote: "One company, one report",
    period: " one-time",
    mode: "payment" as const,
    priceId: "price_1TEEvz89MyCOs8yvWbLINfKw",
    hook: "Walk In Prepared.",
    description: "A deep-dive employer intelligence report built for one specific company and interview. Data-backed negotiation prep included.",
    action: "Get My Dossier",
    popular: true,
    features: [
      "Full employer intelligence dossier",
      "Compensation benchmarks (BLS data)",
      "Negotiation talking points & scripts",
      "Interview intelligence brief",
      "Red flag summary with sources",
    ],
  },
  {
    number: 4,
    name: "The Executive",
    icon: Rocket,
    price: "$999",
    priceNote: "Billed annually",
    period: "/year",
    mode: "subscription" as const,
    priceId: "price_1TEEw589MyCOs8yvQI8FpHJx",
    hook: "Career On Autopilot.",
    description: "Full-service career management. Jackye and the WDIWF intelligence engine working for you year-round.",
    action: "Go Executive",
    features: [
      "Apply When It Counts™ placement engine",
      "Full career mapping & 5-year plan",
      "Quarterly 1-on-1 strategy sessions with Jackye",
      "Priority response within 24 hours",
      "All Pro + Dossier features included",
      "Dedicated Slack channel for ongoing support",
    ],
  },
];

export function PathfinderTracks({ showAll = false }: { showAll?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  // On homepage: show first 3 tiers. On /pricing: show all 4.
  const visibleTracks = showAll ? tracks : tracks.slice(0, 3);

  const handleTrackAction = async (track: typeof tracks[0]) => {
    if (track.mode === "free") {
      navigate("/join");
      return;
    }

    if (!user) {
      toast.error("Sign in first to continue.", {
        action: { label: "Sign in", onClick: () => navigate("/login") },
      });
      return;
    }

    if (!track.priceId) {
      toast.error("Unable to start checkout. Please try again.");
      return;
    }

    setLoading(track.priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: track.priceId, mode: track.mode },
      });
      if (error) {
        toast.error("Unable to start checkout. Please try again.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Unable to start checkout. Please try again.");
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
          <p className="text-sm text-muted-foreground max-w-[520px] mx-auto mb-8">
            From free career calibration to full career management. Start where you are.
          </p>
        </div>

        <div className={cn(
          "grid gap-px bg-border border border-border",
          showAll
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-3"
        )}>
          {visibleTracks.map((track) => (
              <div
                key={track.number}
                className={cn(
                  "bg-card p-6 lg:p-7 flex flex-col relative",
                  track.popular && "ring-2 ring-primary ring-inset"
                )}
              >
                {track.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center font-mono text-xs tracking-[0.2em] uppercase py-1">
                    Most Popular
                  </div>
                )}

                <div className={cn("mb-4", track.popular && "mt-4")}>
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
                    <div className="text-xs text-muted-foreground mt-0.5">{track.priceNote}</div>
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
                  disabled={!!loading}
                >
                  {loading === track.priceId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      {track.action}
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </Button>
              </div>
          ))}
        </div>

        {!showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/pricing")}
              className="font-mono text-sm tracking-wider uppercase text-primary hover:underline inline-flex items-center gap-1.5"
            >
              See all plans <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-muted-foreground mt-2">
              Including deep-dive dossiers and full career management.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}