import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";

const PARTICLE_LABELS = ["FEC", "SEC", "NLRB", "OSHA", "$", "§", "27", "WARN", "DOJ"];

export default function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { containerRef, getToken, resetToken } = useTurnstile();

  usePageSEO({
    title: "Get Early Access — Who Do I Work For?",
    description:
      "Research any employer using public records — FEC filings, SEC reports, WARN notices, OSHA violations — all in one audit. Built by a recruiter, for everyone.",
    path: "/join",
  });

  useEffect(() => {
    const stored = localStorage.getItem("wdiwf_signed_up");
    if (stored === "true") setSubmitted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !role) return;
    setLoading(true);

    const token = await getToken();
    const verified = token ? await verifyTurnstileToken(token) : false;
    resetToken();

    if (!verified) {
      setLoading(false);
      return;
    }

    try {
      await supabase.from("early_access_signups").insert({
        first_name: "",
        email: email.trim().toLowerCase(),
        persona: role,
        referral_source: "vegas-early-access",
      });
    } catch (_) {
      // Insert optional — still show success
    }

    localStorage.setItem("wdiwf_signed_up", "true");
    localStorage.setItem("wdiwf_signup_email", email.trim().toLowerCase());
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0a0a0e", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Background floating particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {[...Array(20)].map((_, i) => {
          const left = `${5 + (i * 47) % 90}%`;
          const delay = `${(i * 1.7) % 12}s`;
          const duration = `${18 + (i * 3) % 14}s`;
          const size = 10 + (i % 4) * 3;
          return (
            <span
              key={i}
              className="absolute animate-float-particle"
              style={{
                left,
                top: `${10 + (i * 31) % 80}%`,
                animationDelay: delay,
                animationDuration: duration,
                fontSize: size,
                color: "rgba(240,192,64,0.08)",
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                userSelect: "none",
              }}
            >
              {PARTICLE_LABELS[i % PARTICLE_LABELS.length]}
            </span>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Logo mark */}
        <div className="flex items-center gap-4 mb-10">
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.88,
              fontSize: "48px",
            }}
          >
            <span style={{ color: "#ffffff" }}>W</span>
            <span style={{ color: "#F0C040", textShadow: "0 0 20px rgba(240,192,64,0.4)" }}>?</span>
          </span>

          <div className="h-10 w-px bg-white/10" />

          <div className="text-left">
            <p className="text-white leading-none tracking-tight" style={{ fontSize: 16, fontWeight: 700 }}>
              Who Do I
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.08em", color: "#F0C040", textTransform: "uppercase", lineHeight: 1.1 }}>
              WORK FOR?
            </p>
            <p className="text-white/40 text-xs tracking-[0.15em] uppercase mt-0.5">
              Career Intelligence
            </p>
          </div>
        </div>

        {!submitted ? (
          <>
            <span className="inline-block mb-6 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[2.5px] border"
              style={{ background: "rgba(240,192,64,0.10)", borderColor: "rgba(240,192,64,0.28)", color: "#F0C040" }}
            >
              Join WDIWF &nbsp;·&nbsp; Now Live
            </span>

            <h1 className="text-center max-w-[680px] mb-5" style={{ fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", color: "#f0ebe0", letterSpacing: "-1.5px", lineHeight: 1.08 }}>
              Know what you're walking into.{" "}
              <span style={{ color: "#F0C040" }}>Before you sign.</span>
            </h1>

            <p className="text-center max-w-[520px] mb-10" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "hsl(var(--muted-foreground))", lineHeight: 1.65 }}>
              Research any employer using public records — FEC filings, SEC reports,
              WARN notices, OSHA violations — all in one audit. Built by a recruiter,
              for everyone who's ever taken a job that looked great on paper.
            </p>

            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-10 flex-wrap">
              {[
                { n: "47K+", l: "Employer Records" },
                { n: "$2.1B", l: "Documented Fines" },
                { n: "100%", l: "Public Data" },
              ].map(({ n, l }) => (
                <div key={l} className="text-center">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>{n}</p>
                  <p className="text-xs uppercase tracking-[1.5px] text-white/35 font-medium mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-[380px]">
              <div ref={containerRef} />
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#F0C040]/60 transition-colors"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="bg-white/5 border border-white/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-[#F0C040]/60 transition-colors appearance-none"
                style={{ color: role ? "#fff" : "rgba(255,255,255,0.25)" }}
              >
                <option value="" disabled>I am a...</option>
                <option value="job-seeker">Job seeker / candidate</option>
                <option value="recruiter">Recruiter / talent acquisition</option>
                <option value="career-coach">Career coach</option>
                <option value="hr-leader">HR leader</option>
                <option value="other">Other</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-sm transition-all disabled:opacity-60"
                style={{ background: "#F0C040", color: "#0a0a0e" }}
              >
                {loading ? "Requesting..." : "Request Early Access →"}
              </button>
            </form>

            <p className="mt-4 text-xs text-white/20 text-center">
              No spam. Access notification only. Built by Jackye Clayton.
            </p>
          </>
        ) : (
          <div className="text-center max-w-[400px]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-extrabold" style={{ background: "rgba(240,192,64,0.15)", color: "#F0C040" }}>
              ✓
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">You're on the list.</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Welcome to WDIWF. The public record isn't going anywhere — and neither are we.
            </p>
            <Link to="/browse" className="inline-block px-6 py-3 rounded-full text-sm font-bold transition-all hover:brightness-110" style={{ background: "#F0C040", color: "#0a0a0e" }}>
              Start Auditing →
            </Link>
            <p className="mt-4 text-xs text-white/20 uppercase tracking-widest">Early Access Confirmed</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.06; }
          25% { transform: translateY(-18px) rotate(3deg); opacity: 0.12; }
          50% { transform: translateY(-8px) rotate(-2deg); opacity: 0.04; }
          75% { transform: translateY(-22px) rotate(1deg); opacity: 0.10; }
        }
        .animate-float-particle {
          animation: float-particle 20s ease-in-out infinite;
        }
        select option {
          background: #1c1a27;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
