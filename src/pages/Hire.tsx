import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Shield } from "lucide-react";

export default function Hire() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageSEO({
    title: "Talent Intelligence — ValuHire by WDIWF",
    description:
      "The first AI recruiting tool that audits the company before it screens the candidate. Built on WDIWF intelligence. Coming April 6th.",
    path: "/hire",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError("");

    try {
      const { error: dbError } = await supabase
        .from("early_access_signups")
        .insert({
          email,
          persona: "I recruit or hire",
          source: "hire-landing",
          utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        } as any);

      if (dbError) {
        if (dbError.code === "23505") {
          setSubmitted(true);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setSubmitted(true);
        localStorage.setItem("wdiwf_signed_up", "true");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0e" }}>
      <Helmet>
        <title>Talent Intelligence — ValuHire by WDIWF</title>
      </Helmet>

      {/* Banner */}
      <div
        className="w-full max-w-2xl rounded-lg px-4 py-3 mb-10 flex items-center gap-3 text-sm"
        style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.18)" }}
      >
        <Shield className="w-4 h-4 shrink-0" style={{ color: "#f0c040" }} />
        <span style={{ color: "#f0ebe0" }}>
          Powered by WDIWF intelligence — every company is audited before candidates are screened.
        </span>
      </div>

      {/* Content */}
      <div className="text-center max-w-2xl">
        <h1
          className="font-sans leading-[1.05] mb-5"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-2px", color: "#f0ebe0" }}
        >
          Talent Intelligence
          <span className="block text-lg mt-2 font-normal tracking-normal" style={{ color: "#f0c040" }}>
            coming April 6th
          </span>
        </h1>

        <p className="text-base sm:text-lg leading-relaxed mb-10 mx-auto max-w-lg" style={{ color: "rgba(240,235,224,0.65)" }}>
          The first AI recruiting tool that audits the company before it screens the candidate.
          Built on WDIWF intelligence.
        </p>

        {submitted ? (
          <div
            className="rounded-lg px-6 py-5 text-center"
            style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.15)" }}
          >
            <p className="text-lg font-semibold" style={{ color: "#f0c040" }}>
              You're on the list ✓
            </p>
            <p className="text-sm mt-1" style={{ color: "rgba(240,235,224,0.55)" }}>
              We'll let you know when Talent Intelligence launches.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 px-4 rounded-lg text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f0ebe0",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#f0c040", color: "#0a0a0e" }}
            >
              {submitting ? "Joining…" : "Get early access"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {error && (
          <p className="text-sm mt-3" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
