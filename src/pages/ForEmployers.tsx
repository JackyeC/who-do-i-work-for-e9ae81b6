import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, Briefcase, Check, X, ArrowRight, Loader2,
  Mail, FileText, Scale, Star, Shield, Zap, Eye, Users, DollarSign,
  AlertTriangle, Building2, Globe, Home, BarChart3, MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/hooks/use-premium";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePageSEO } from "@/hooks/use-page-seo";

const TIERS = [
  {
    id: "unverified",
    name: "Unverified",
    price: "Free",
    badge: null,
    badgeIcon: null,
    description: "Default state — your company exists in our database but hasn't been claimed.",
    features: [
      { label: "Company profile visible to candidates", included: true },
      { label: "Platform research displayed publicly", included: true },
      { label: "Edit company description", included: false },
      { label: "Post job listings", included: false },
      { label: "Respond to research findings", included: false },
      { label: "Certified Gold Shield badge", included: false },
    ],
  },
  {
    id: "verified",
    name: "Verified",
    price: "Free",
    badge: "Verified",
    badgeIcon: Shield,
    badgeClass: "text-primary border-primary/20 bg-primary/5",
    description: "Claim your profile with a work email. Confirm your identity without compromising our independence.",
    features: [
      { label: "Everything in Unverified", included: true },
      { label: "Add company description", included: true },
      { label: "Post open job listings", included: true },
      { label: "Submit one Official Response to a finding", included: true },
      { label: "Shield badge on profile and job board", included: true },
      { label: "Full transparency audit", included: false },
    ],
  },
  {
    id: "certified",
    name: "Certified — Founding Partner",
    price: "$599/yr",
    originalPrice: "$999/yr",
    badge: "Certified",
    badgeIcon: ShieldCheck,
    badgeClass: "text-amber-600 border-amber-500/20 bg-amber-500/10",
    description: "Pass Jackye's transparency audit to earn the Gold Shield. Founding cohort pricing — limited availability.",
    features: [
      { label: "Everything in Verified", included: true },
      { label: "Permanent Founding Partner Gold Shield", included: true },
      { label: "5 job slots (30 days each)", included: true },
      { label: "Full 10-point Transparency Audit", included: true },
      { label: "Unlimited Official Responses to findings", included: true },
      { label: "Publish compensation bands & workforce metrics", included: true },
    ],
  },
];

const transparencyAudit = [
  { icon: Building2, label: "Legal entity confirmed" },
  { icon: Users, label: "Leadership team publicly disclosed" },
  { icon: DollarSign, label: "Compensation bands provided (3+ roles)" },
  { icon: AlertTriangle, label: "WARN notice status disclosed" },
  { icon: Globe, label: "Political contribution activity disclosed" },
  { icon: Scale, label: "Non-compete policy disclosed" },
  { icon: Home, label: "Remote / hybrid work policy published" },
  { icon: BarChart3, label: "Workforce representation data provided" },
  { icon: Star, label: "Employee NPS or engagement signal disclosed" },
  { icon: ShieldCheck, label: "Final approval by WDIWF" },
];

export default function ForEmployers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  usePageSEO({
    title: "For Employers — Claim, Respond & Get Certified",
    description: "Post values-aligned jobs and earn Gold Shield certification on Who Do I Work For. Founding Partner pricing available now.",
    path: "/for-employers",
  });

  const handleCheckout = async (priceId: string, tierName: string) => {
    if (!user) { navigate("/login"); return; }
    setLoadingTier(tierName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 lg:px-16 py-24 lg:py-32 max-w-[960px] mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-mono uppercase tracking-wider">
            For Employers
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Your candidates are checking.{" "}
            <span className="text-primary">Show them the receipts.</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto mb-4 leading-relaxed">
            Claim your company profile, respond to intelligence findings, and earn Certified status —
            all without suppressing a single data point.
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
            Certification provides transparency signals, not reputation control. The platform remains independent.
          </p>
        </section>

        {/* Three-Tier Comparison */}
        <section className="px-6 lg:px-16 pb-20 max-w-[1100px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const isCertified = tier.id === "certified";
              const isVerified = tier.id === "verified";
              return (
                <Card
                  key={tier.id}
                  className={cn(
                    "border-border/40 bg-card relative",
                    isCertified && "border-amber-500/30 ring-1 ring-amber-500/10"
                  )}
                >
                  {isCertified && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs border-0">
                      Founders' Special
                    </Badge>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Badge preview */}
                    <div className="flex items-center gap-2 mb-3">
                      {tier.badgeIcon && (
                        <Badge variant="outline" className={cn("text-[10px] gap-1", tier.badgeClass)}>
                          <tier.badgeIcon className="w-3 h-3" /> {tier.badge}
                        </Badge>
                      )}
                      {!tier.badgeIcon && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          No Badge
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold font-mono text-foreground">{tier.price}</span>
                    </div>
                    {tier.originalPrice && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground line-through">{tier.originalPrice}</span>
                        <Badge variant="secondary" className="text-[10px] text-green-600 bg-green-500/10 border-green-500/20">
                          Save 40%
                        </Badge>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{tier.description}</p>

                    <ul className="space-y-2 flex-1 mb-6">
                      {tier.features.map((f) => (
                        <li key={f.label} className="flex items-start gap-2 text-sm">
                          {f.included ? (
                            <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isCertified ? "text-amber-600" : "text-primary")} />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                          )}
                          <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {tier.id === "unverified" && (
                      <Button variant="outline" className="w-full" disabled>
                        Default Status
                      </Button>
                    )}
                    {tier.id === "verified" && (
                      <Button
                        variant="outline"
                        className="w-full gap-1.5"
                        onClick={() => user ? navigate("/employer/verification-pending") : navigate("/login")}
                      >
                        <Mail className="w-4 h-4" /> Start Verification
                      </Button>
                    )}
                    {tier.id === "certified" && (
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                        onClick={() => handleCheckout(STRIPE_TIERS.founding_partner.price_id, "founding_partner")}
                        disabled={loadingTier === "founding_partner"}
                      >
                        {loadingTier === "founding_partner" && <Loader2 className="w-4 h-4 animate-spin" />}
                        <ShieldCheck className="w-4 h-4" /> Become a Founding Partner
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 10-Point Transparency Audit */}
        <section className="bg-card border-y border-border px-6 lg:px-16 py-20">
          <div className="max-w-[960px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                The 10-Point Transparency Audit
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The Gold Shield is earned, not bought. Payment gets you in the door — the transparency audit gets you certified.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {transparencyAudit.map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-4 border border-border/40 rounded-lg bg-background"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Official Response + Independence */}
        <section className="px-6 lg:px-16 py-16 max-w-[960px] mx-auto space-y-6">
          <Card className="border-border/40 bg-muted/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <MessageSquare className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Official Company Response</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Employers cannot edit platform research. Instead, Verified and Certified companies
                    may submit an <span className="font-semibold text-foreground">"Official Company Response"</span> to
                    any research finding. Responses are reviewed before appearing on the company page.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Verified employers: 1 response. Certified employers: unlimited responses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-muted/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-3">Certification Independence Rule</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Certification does not guarantee positive research findings.
                Certified companies acknowledge that independent research may still be published.
                Payment grants the right to respond — but provides{" "}
                <span className="font-semibold text-foreground">zero authority</span> to
                edit, remove, or suppress any data found by AI or independent research.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Single Job Credit */}
        <section className="px-6 lg:px-16 py-16 max-w-[960px] mx-auto">
          <Card className="border-border/40">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">One-Time</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Single Job Credit — $199</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  One 'Value-Aligned' job post on the Job Integrity Board for 30 days.
                  Includes standard transparency data overlay, Strategic Context, and Connection Chain (read-only).
                </p>
                <ul className="space-y-1.5 text-sm">
                  {["1 job post for 30 days", "Standard transparency overlay", "No Gold Shield required"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => handleCheckout(STRIPE_TIERS.single_job_credit.price_id, "single_job")}
                disabled={loadingTier === "single_job"}
              >
                {loadingTier === "single_job" && <Loader2 className="w-4 h-4 animate-spin" />}
                Post a Job
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="px-6 lg:px-16 py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Ready to show your receipts?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Your candidates are already checking. Meet them with transparency.
          </p>
          <Button
            size="lg"
            onClick={() => handleCheckout(STRIPE_TIERS.founding_partner.price_id, "founding_partner_cta")}
            disabled={!!loadingTier}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {loadingTier === "founding_partner_cta" && <Loader2 className="w-4 h-4 animate-spin" />}
            <ShieldCheck className="w-4 h-4" />
            Get Started as a Founding Partner
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
