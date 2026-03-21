import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    name: "Look Around",
    tier: "Free",
    price: "$0",
    period: "",
    icon: "🔍",
    popular: false,
    cta: "Start Free",
    ctaLink: "/join",
    features: [
      "Browse company culture profiles",
      "See public integrity scores",
      "Access 3 company deep-dives per month",
    ],
  },
  {
    name: "Apply With Intention",
    tier: "Core",
    price: "$29",
    period: "/month",
    icon: "🎯",
    popular: false,
    cta: "Get Started",
    ctaLink: "/join",
    features: [
      "Unlimited company intelligence",
      "Full alignment scoring",
      "Red flag alerts before you apply",
      "Interview prep by company culture",
      "Track up to 10 active applications",
    ],
  },
  {
    name: "We Move With You",
    tier: "Premium",
    price: "$79",
    period: "/month",
    icon: "⚡",
    popular: true,
    cta: "Get Started",
    ctaLink: "/join",
    features: [
      "Everything in Core",
      "Unlimited application tracking",
      "Salary negotiation intelligence",
      "Recruiter red flag alerts",
      "Priority support + early feature access",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  usePageSEO({
    title: "Pricing — Who Do I Work For?",
    description:
      "Choose how you want to move. Free, Core ($29/mo), or Premium ($79/mo) plans for values-aligned career intelligence.",
    path: "/pricing",
    jsonLd: {
      "@type": "WebPage",
      name: "Pricing — Who Do I Work For?",
      description: "Free, Core, and Premium plans for values-aligned career intelligence.",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
          { "@type": "Offer", name: "Core", price: "29", priceCurrency: "USD" },
          { "@type": "Offer", name: "Premium", price: "79", priceCurrency: "USD" },
          { "@type": "Offer", name: "Career Fit Report", price: "49", priceCurrency: "USD" },
        ],
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF7" }}>
      <Helmet>
        <title>Pricing — Who Do I Work For?</title>
      </Helmet>

      <div className="flex-1 flex flex-col items-center px-6 py-20">
        {/* Header */}
        <h1
          className="text-center leading-[1.1] mb-3"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: "-1px",
          }}
        >
          Choose how you want to move
        </h1>
        <p
          className="text-center max-w-lg mb-14"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "17px",
            color: "#6b6b6b",
            lineHeight: 1.6,
          }}
        >
          Not everyone is in the same place. Meet yourself where you are.
        </p>

        {/* 3-column tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[960px] w-full mb-14">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-2xl p-7 flex flex-col relative"
              style={{
                background: "#ffffff",
                border: tier.popular
                  ? "2px solid #D97706"
                  : "1px solid #e5e5e0",
                boxShadow: tier.popular
                  ? "0 8px 30px rgba(217, 119, 6, 0.12)"
                  : "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {tier.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[2px] px-4 py-1 rounded-full"
                  style={{
                    background: "#D97706",
                    color: "#ffffff",
                  }}
                >
                  Most Popular
                </span>
              )}
              <span className="text-3xl mb-3">{tier.icon}</span>
              <span
                className="text-xs font-semibold uppercase tracking-[2px] mb-1"
                style={{ color: "#999" }}
              >
                {tier.tier}
              </span>
              <h3
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#1a1a1a",
                    letterSpacing: "-2px",
                  }}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span style={{ fontSize: "14px", color: "#999" }}>
                    {tier.period}
                  </span>
                )}
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "14px",
                        color: "#555",
                        lineHeight: 1.5,
                      }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(tier.ctaLink)}
                className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  background: tier.popular ? "#D97706" : "#1a1a1a",
                  color: "#ffffff",
                }}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Career Fit Report — standalone card */}
        <div
          className="rounded-2xl p-8 max-w-[640px] w-full text-center"
          style={{
            background: "#ffffff",
            border: "1px solid #e5e5e0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <span className="text-4xl mb-3 block">💎</span>
          <h3
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            Career Fit Report
          </h3>
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "32px",
                fontWeight: 800,
                color: "#1a1a1a",
                letterSpacing: "-1.5px",
              }}
            >
              $49
            </span>
            <span style={{ fontSize: "14px", color: "#999" }}>one-time</span>
          </div>
          <p
            className="mb-6"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              color: "#6b6b6b",
              lineHeight: 1.6,
            }}
          >
            One deep-dive into your target company. Is it actually the right fit for you?
          </p>
          <ul className="space-y-3 text-left max-w-sm mx-auto mb-8">
            {[
              "Full culture + values analysis",
              "Leadership & stability assessment",
              "Compensation benchmarking",
              "Personalized fit score with explanation",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "14px",
                    color: "#555",
                    lineHeight: 1.5,
                  }}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/join")}
            className="h-12 px-8 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "#1a1a1a", color: "#ffffff" }}
          >
            Get My Report
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trust footer */}
        <p
          className="text-center mt-12"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            color: "#999",
          }}
        >
          No pressure. No spam. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
