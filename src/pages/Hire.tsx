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
    title: "Who Works For You? — Values-Aligned Hiring by WDIWF",
    description:
      "The first AI recruiting tool that audits the company before it screens the candidate. Values-aligned hiring built on 15 years of recruiting intelligence.",
    path: "/hire",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);
    setError("");

    const referralSource = new URLSearchParams(window.location.search).get("utm_source") || "hire-landing";
    const isDuplicateError = (code?: string | null, message?: string | null, details?: string | null) =>
      code === "23505" || `${message ?? ""} ${details ?? ""}`.toLowerCase().includes("duplicate key");

    try {
      const { error: primaryError } = await supabase
        .from("early_access_signups")
        .insert({
          email: normalizedEmail,
          first_name: "Recruiter",
          persona: "I recruit or hire",
          referral_source: referralSource,
        });

      if (!primaryError || isDuplicateError(primaryError.code, primaryError.message, primaryError.details)) {
        setSubmitted(true);
        try {
          localStorage.setItem("wdiwf_signed_up", "true");
        } catch (storageError) {
          console.warn("Could not persist signup state:", storageError);
        }
        return;
      }

      console.error("Hire signup primary insert error:", primaryError.code, primaryError.message, primaryError.details);

      const { error: fallbackError } = await supabase
        .from("email_signups")
        .insert({ email: normalizedEmail, source: referralSource });

      if (!fallbackError || isDuplicateError(fallbackError.code, fallbackError.message, fallbackError.details)) {
        setSubmitted(true);
        try {
          localStorage.setItem("wdiwf_signed_up", "true");
        } catch (storageError) {
          console.warn("Could not persist signup state:", storageError);
        }
        return;
      }

      console.error("Hire signup fallback insert error:", fallbackError.code, fallbackError.message, fallbackError.details);
      setError("Something went wrong. Please try again.");
    } catch (unexpectedError) {
      console.error("Hire signup unexpected error:", unexpectedError);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0e" }}>
      <Helmet>
        <title>Who Works For You? — WDIWF</title>
      </Helmet>

      {/* Banner */}
      <div
        className="w-full max-w-2xl rounded-lg px-4 py-3 mb-12 flex items-center gap-3 text-sm"
        style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.18)" }}
      >
        <Shield className="w-4 h-4 shrink-0" style={{ color: "#f0c040" }} />
        <span style={{ color: "#f0ebe0" }}>
          Powered by WDIWF intelligence — every company is audited before candidates are screened.
        </span>
      </div>

      {/* Content */}
      <div className="text-center max-w-2xl">
        {/* Eyebrow */}
        <p
          className="text-xs uppercase tracking-[3px] font-semibold mb-4"
          style={{ color: "#f0c040" }}
        >
          Coming April 6th
        </p>

        {/* Headline */}
        <h1
          className="font-sans leading-[1.05] mb-5"
          style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, letterSpacing: "-3px", color: "#f0ebe0" }}
        >
          Who Works For You?
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg leading-relaxed mb-4 mx-auto max-w-lg" style={{ color: "rgba(240,235,224,0.65)" }}>
          The first AI recruiting tool that audits the company before it screens the candidate. Values-aligned hiring — built on 15 years of recruiting intelligence.
        </p>

        {/* Attribution */}
        <p className="text-xs uppercase tracking-[2px] mb-10" style={{ color: "rgba(240,235,224,0.35)" }}>
          A WDIWF product by Jackye Clayton
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
              We'll let you know when recruiter access launches.
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
              className="h-12 px-6 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              style={{ background: "#f0c040", color: "#0a0a0e" }}
            >
              {submitting ? "Joining…" : "Get early recruiter access"}
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
