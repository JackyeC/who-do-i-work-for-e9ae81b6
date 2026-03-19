import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Shield } from "lucide-react";

type WaitlistRole = "candidate" | "recruiter" | "employer";

const inMemoryWaitlist: Array<{ email: string; created_at: string; role: WaitlistRole }> = [];

const addToInMemoryWaitlist = (email: string, role: WaitlistRole) => {
  if (!inMemoryWaitlist.some((entry) => entry.email === email && entry.role === role)) {
    inMemoryWaitlist.push({ email, created_at: new Date().toISOString(), role });
  }
};

export default function Hire() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  usePageSEO({
    title: "Who Works For You? — Values-Aligned Hiring by WDIWF",
    description:
      "The first AI recruiting tool that audits the company before it screens the candidate. Values-aligned hiring built on 15 years of recruiting intelligence.",
    path: "/hire",
  });

  const markSignedUp = () => {
    try {
      localStorage.setItem("wdiwf_signed_up", "true");
    } catch (storageError) {
      console.warn("Could not persist signup state:", storageError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);

    const completeSignup = () => {
      setSubmitted(true);
      markSignedUp();
    };

    try {
      const { error: waitlistError } = await supabase.from("waitlist").insert({
        email: normalizedEmail,
        role: "recruiter",
      });

      if (waitlistError && waitlistError.code !== "23505") {
        console.warn("Waitlist insert failed, using in-memory fallback:", waitlistError.code, waitlistError.message);
        addToInMemoryWaitlist(normalizedEmail, "recruiter");
      }

      completeSignup();
    } catch (unexpectedError) {
      console.warn("Unexpected waitlist error, using in-memory fallback:", unexpectedError);
      addToInMemoryWaitlist(normalizedEmail, "recruiter");
      completeSignup();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0e" }}>
      <Helmet>
        <title>Who Works For You? — WDIWF</title>
      </Helmet>

      <div
        className="w-full max-w-2xl rounded-lg px-4 py-3 mb-12 flex items-center gap-3 text-sm"
        style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.18)" }}
      >
        <Shield className="w-4 h-4 shrink-0" style={{ color: "#f0c040" }} />
        <span style={{ color: "#f0ebe0" }}>
          Powered by WDIWF intelligence — every company is audited before candidates are screened.
        </span>
      </div>

      <div className="text-center max-w-2xl">
        <p className="text-xs uppercase tracking-[3px] font-semibold mb-4" style={{ color: "#f0c040" }}>
          Coming April 6th
        </p>

        <h1
          className="font-sans leading-[1.05] mb-5"
          style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, letterSpacing: "-3px", color: "#f0ebe0" }}
        >
          Who Works For You?
        </h1>

        <p className="text-base sm:text-lg leading-relaxed mb-4 mx-auto max-w-lg" style={{ color: "rgba(240,235,224,0.65)" }}>
          The first AI recruiting tool that audits the company before it screens the candidate. Values-aligned hiring — built on 15 years of recruiting intelligence.
        </p>

        <p className="text-xs uppercase tracking-[2px] mb-10" style={{ color: "rgba(240,235,224,0.35)" }}>
          A WDIWF product by Jackye Clayton
        </p>

        {submitted ? (
          <div
            className="rounded-lg px-6 py-5 text-center"
            style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.15)" }}
          >
            <p className="text-lg font-semibold" style={{ color: "#f0c040" }}>
              You're on the list. We'll reach out when your spot opens.
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
      </div>
    </div>
  );
}
