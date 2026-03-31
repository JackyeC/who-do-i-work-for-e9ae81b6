import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Shield, Eye, Users } from "lucide-react";

const INTEREST_OPTIONS = [
  "Offer review and negotiation support",
  "Leaving a company safely",
  "Values misalignment — am I crazy?",
  "Career growth and next moves",
  "Referrals and networking",
  "Anonymous support and venting",
] as const;

export default function Community() {
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  usePageSEO({
    title: "Private Community — Who Do I Work For",
    description:
      "A private, moderated space for workers navigating real career decisions, values misalignment, and next moves. Join the waitlist.",
    path: "/community",
  });

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: normalizedEmail,
        role: "candidate" as const,
        interests,
      });
      if (error && error.code !== "23505") {
        console.warn("Waitlist insert failed:", error.code, error.message);
      }
      setSubmitted(true);
      try {
        localStorage.setItem("wdiwf_community_waitlist", "true");
      } catch {}
    } catch (err) {
      console.warn("Unexpected waitlist error:", err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16 sm:py-24" style={{ background: "#0a0a0e" }}>
      <Helmet>
        <title>Private Community — Who Do I Work For</title>
      </Helmet>

      <div className="w-full max-w-2xl">
        {/* ── HERO ── */}
        <section className="text-center mb-16">
          <p
            className="text-xs uppercase tracking-[3px] font-semibold mb-4"
            style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace" }}
          >
            Waitlist Open
          </p>
          <h1
            className="font-sans leading-[1.05] mb-5"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              color: "#f0ebe0",
            }}
          >
            Private Community
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed mx-auto max-w-lg mb-4"
            style={{ color: "rgba(240,235,224,0.65)" }}
          >
            A private space for workers who want honest support, safer conversations, and values-aligned careers.
          </p>
          <p
            className="text-sm leading-relaxed mx-auto max-w-md"
            style={{ color: "rgba(240,235,224,0.4)" }}
          >
            Not a public feed. Not a networking performance. A moderated space for people navigating real career decisions.
          </p>
        </section>

        {/* ── WHAT THIS IS ── */}
        <section className="mb-16">
          <h2
            className="text-xs uppercase tracking-[3px] font-semibold mb-6"
            style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace" }}
          >
            What This Is
          </h2>
          <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: "rgba(240,235,224,0.7)" }}>
            <p>
              This is a private, moderated, pseudonym-friendly community built for people dealing with real work questions — not content performance.
            </p>
            <p>
              You do not need to show up as your full public self to be taken seriously here. Use your name, a version of it, or something else entirely. What matters is the question you're carrying, not the brand you're projecting.
            </p>
            <p>
              The goal is support, clarity, and connection around career decisions — offer reviews, exits, values misalignment, negotiation, and figuring out what's next.
            </p>
            <p style={{ color: "#f0ebe0", fontWeight: 600 }}>
              Your identity is yours. Your questions are valid. Your experience matters.
            </p>
          </div>
        </section>

        {/* ── PRIVACY & SAFETY ── */}
        <section className="mb-16">
          <h2
            className="text-xs uppercase tracking-[3px] font-semibold mb-6"
            style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace" }}
          >
            Privacy & Safety
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Users className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Pseudonyms welcome",
                body: "Use your name, a version of your name, or a pseudonym. We want the conversation to feel safe enough for honesty.",
              },
              {
                icon: <Shield className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Moderated and intentional",
                body: "No recruiter spam. No sales pitches. No harvesting people's vulnerability for content.",
              },
              {
                icon: <Eye className="w-5 h-5" style={{ color: "#f0c040" }} />,
                title: "Built with privacy in mind",
                body: "We are designing this space to limit exposure, protect trust, and keep participation intentional.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg p-5"
                style={{ background: "#13121a", border: "1px solid rgba(240,192,64,0.12)" }}
              >
                <div className="mb-3">{card.icon}</div>
                <h3 className="text-sm font-bold mb-2" style={{ color: "#f0ebe0" }}>
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(240,235,224,0.55)" }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INTEREST SELECTION ── */}
        <section className="mb-12">
          <h2
            className="text-xs uppercase tracking-[3px] font-semibold mb-6"
            style={{ color: "#f0c040", fontFamily: "'DM Mono', monospace" }}
          >
            What are you here for?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className="text-left rounded-lg px-4 py-3 text-sm transition-colors"
                  style={{
                    background: selected ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selected ? "rgba(240,192,64,0.35)" : "rgba(255,255,255,0.08)"}`,
                    color: selected ? "#f0ebe0" : "rgba(240,235,224,0.55)",
                  }}
                >
                  <span className="mr-2">{selected ? "✓" : "○"}</span>
                  {interest}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: "rgba(240,235,224,0.3)" }}>
            Optional — helps us shape the space.
          </p>
        </section>

        {/* ── WAITLIST FORM ── */}
        <section className="mb-16">
          {submitted ? (
            <div
              className="rounded-lg px-6 py-5 text-center"
              style={{ background: "rgba(240,192,64,0.08)", border: "1px solid rgba(240,192,64,0.15)" }}
            >
              <p className="text-lg font-semibold mb-1" style={{ color: "#f0c040" }}>
                You're on the list.
              </p>
              <p className="text-sm" style={{ color: "rgba(240,235,224,0.5)" }}>
                We'll reach out when the community opens up.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
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
                  {submitting ? "Joining…" : "Join the Waitlist"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs text-center mt-4" style={{ color: "rgba(240,235,224,0.3)" }}>
                No spam. No data selling. We'll reach out when your spot opens.
              </p>
            </>
          )}
        </section>

        {/* ── CLOSING ── */}
        <section className="text-center">
          <div
            className="rounded-lg px-6 py-5 mx-auto max-w-md"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(240,235,224,0.55)" }}>
              This is an early waitlist — not an open community today. Early joiners are helping shape the space.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(240,235,224,0.55)" }}>
              The goal is a better kind of career support environment — built slowly, on purpose.
            </p>
          </div>
          <p
            className="text-xs uppercase tracking-[2px] mt-8"
            style={{ color: "rgba(240,235,224,0.25)" }}
          >
            A Who Do I Work For product by Jackye Clayton
          </p>
        </section>
      </div>
    </div>
  );
}
