import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";

// Launch date removed — /join page always shows the signup form
const BASE_COUNT = 312;

const PERSONAS = [
  "Looking for a job",
  "Evaluating an offer",
  "I recruit or hire",
  "I lead a company or team",
  "Selling or partnering",
  "Employer brand / marketing",
  "Investing or advising",
  "Research or journalism",
  "Changing careers",
];

function useAnimatedCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function EarlyAccess() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [persona, setPersona] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [signupCount, setSignupCount] = useState(BASE_COUNT);
  const [alreadySigned, setAlreadySigned] = useState(false);

  usePageSEO({
    title: "Get Early Access",
    description: "Join the early access list for Who Do I Work For? — the career intelligence platform that runs a background check on companies, not candidates. Launching April 2025.",
    path: "/join",
  });

  useEffect(() => {
    const stored = localStorage.getItem("wdiwf_signed_up");
    if (stored === "true") setAlreadySigned(true);

    supabase
      .rpc("get_early_access_count")
      .then(({ data }) => {
        if (data != null) setSignupCount(BASE_COUNT + Number(data));
      });
  }, []);

  const animatedCount = useAnimatedCounter(signupCount);

  const getUtmParams = () => {
    const params = new URLSearchParams(window.location.search);
    const parts = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
      .map((k) => params.get(k))
      .filter(Boolean);
    return parts.length ? parts.join(" | ") : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persona) { setError("Please select what brings you here."); return; }
    if (!email) { setError("Email is required."); return; }
    setError("");
    setSubmitting(true);

    const { error: dbErr } = await supabase.from("early_access_signups").insert({
      first_name: firstName.trim(),
      email: email.trim().toLowerCase(),
      persona,
      referral_source: getUtmParams(),
    });

    if (dbErr) {
      if (dbErr.code === "23505") {
        setError("You're already on the list!");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
      return;
    }

    localStorage.setItem("wdiwf_signed_up", "true");
    localStorage.setItem("wdiwf_signup_email", email.trim().toLowerCase());
    setSignupCount((c) => c + 1);
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      "I just got early access to WDIWF — the platform that runs a background check on companies before you work for them. Launching in April: wdiwf.jackyeclayton.com/join"
    );
  };

  // /join always shows the signup form — no redirect

  return (
    <div
      style={{
        background: "#0a0a0e",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0ebe0",
        position: "relative",
      }}
    >
      {/* Grain overlay */}
      <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, opacity: 0.04 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Nav */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: 960, margin: "0 auto" }}>
          <Link to="/" style={{ fontSize: 18, fontWeight: 800, color: "#f0ebe0", textDecoration: "none", letterSpacing: "-0.5px" }}>
            Who Do I Work For?
          </Link>
          <Link to="/dashboard" style={{ fontSize: 13, color: "#7a7590", textDecoration: "none" }}>
            Already have access? Sign in →
          </Link>
        </nav>

        {/* Main content */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Section 1 — The Hook */}
          <span style={{
            display: "inline-block",
            background: "rgba(240,192,64,0.10)",
            border: "1px solid rgba(240,192,64,0.28)",
            color: "#f0c040",
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "2.5px",
            marginBottom: 28,
          }}>
            Early Access — Soft Launch
          </span>

          <h1 style={{
            fontWeight: 800,
            fontSize: "clamp(32px,5vw,56px)",
            color: "#f0ebe0",
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 16,
            textAlign: "center",
            maxWidth: 700,
          }}>
            You deserve to know exactly who you work for.
          </h1>

          <p style={{
            fontWeight: 400,
            fontSize: "clamp(16px,2vw,20px)",
            color: "#b8b4a8",
            lineHeight: 1.65,
            maxWidth: 520,
            margin: "0 auto 36px",
            textAlign: "center",
          }}>
            Before April — get access to the intelligence platform that runs a background check on companies, not just candidates.
          </p>

          <p style={{ fontSize: 14, fontWeight: 500, color: "#7a7590", textAlign: "center", marginBottom: 36 }}>
            Join <span style={{ color: "#f0ebe0", fontWeight: 700 }}>{animatedCount.toLocaleString()}</span> people auditing before they apply
          </p>

          {/* Section 2 — The Form */}
          <div style={{
            background: "#13121a",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: "36px 40px",
            maxWidth: 480,
            width: "100%",
          }} className="join-form-card">
            {submitted ? (
              /* Success State */
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#f0c040", marginBottom: 16 }}>✓</div>
                <h2 style={{ fontSize: 32, fontWeight: 800, color: "#f0ebe0", letterSpacing: "-1px", marginBottom: 12 }}>You're in.</h2>
                <p style={{ fontSize: 16, color: "#b8b4a8", lineHeight: 1.65, marginBottom: 28 }}>
                  We'll email you the moment we launch in April. Until then — you can explore the platform now.
                </p>
                <a
                  href="/"
                  style={{
                    display: "inline-block",
                    background: "#f0c040",
                    color: "#0a0a0e",
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "14px 36px",
                    borderRadius: 50,
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  Explore WDIWF now →
                </a>
                <br />
                <button
                  onClick={handleShare}
                  style={{ fontSize: 14, color: "#7a7590", textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Copy share link →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {alreadySigned && (
                  <div style={{
                    background: "rgba(240,192,64,0.10)",
                    border: "1px solid rgba(240,192,64,0.28)",
                    color: "#f0c040",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 16,
                    textAlign: "center",
                  }}>
                    You're already on the list ✓
                  </div>
                )}

                {/* First name */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#b8b4a8", marginBottom: 6 }}>First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  style={{
                    width: "100%",
                    background: "#1c1a27",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 15,
                    color: "#f0ebe0",
                    outline: "none",
                    marginBottom: 16,
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(240,192,64,0.50)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />

                {/* Email */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#b8b4a8", marginBottom: 6 }}>Work or personal email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@wherever.com"
                  style={{
                    width: "100%",
                    background: "#1c1a27",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    fontSize: 15,
                    color: "#f0ebe0",
                    outline: "none",
                    marginBottom: 16,
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(240,192,64,0.50)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
                />

                {/* Persona selector */}
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#b8b4a8", marginBottom: 8 }}>What brings you here?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }} className="persona-grid">
                  {PERSONAS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPersona(p)}
                      style={{
                        background: persona === p ? "rgba(240,192,64,0.12)" : "#1c1a27",
                        border: `1px solid ${persona === p ? "#f0c040" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 50,
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: persona === p ? 500 : 400,
                        color: persona === p ? "#f0ebe0" : "#b8b4a8",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "center",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: "#ff6b6b", marginBottom: 12, textAlign: "center" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    background: "#f0c040",
                    color: "#0a0a0e",
                    fontSize: 15,
                    fontWeight: 700,
                    padding: 16,
                    borderRadius: 50,
                    border: "none",
                    cursor: submitting ? "wait" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: submitting ? 0.7 : 1,
                    transition: "opacity 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.7" : "1"; }}
                >
                  {alreadySigned ? "You're in — share with someone →" : "Get early access →"}
                </button>

                {alreadySigned && (
                  <button
                    type="button"
                    onClick={handleShare}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      background: "none",
                      border: "none",
                      color: "#7a7590",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Copy share link
                  </button>
                )}

                <p style={{ fontSize: 12, fontWeight: 400, color: "#3d3a4a", textAlign: "center", marginTop: 14 }}>
                  No spam. No selling your data. One email when we launch in April.
                </p>
              </form>
            )}
          </div>

          {/* Section 3 — Social Proof */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, marginTop: 48, flexWrap: "wrap" }} className="social-proof-strip">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f0ebe0", letterSpacing: "-1px" }}>850+</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#7a7590", textTransform: "uppercase", letterSpacing: "1.5px" }}>Companies tracked</div>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.08)" }} className="proof-sep" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f0ebe0", letterSpacing: "-1px" }}>6</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#7a7590", textTransform: "uppercase", letterSpacing: "1.5px" }}>Federal data sources</div>
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.08)" }} className="proof-sep" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f0ebe0", letterSpacing: "-1px" }}>15+</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#7a7590", textTransform: "uppercase", letterSpacing: "1.5px" }}>Years HR expertise</div>
            </div>
          </div>

          {/* Section 4 — Value Stack */}
          <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#7a7590", textAlign: "center", marginBottom: 20, marginTop: 56 }}>
            What early access includes
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, maxWidth: 800, width: "100%" }} className="value-cards">
            {[
              { eyebrow: "Free", color: "#f0c040", bg: "rgba(240,192,64,0.12)", border: "rgba(240,192,64,0.3)", title: "Employer Audit", body: "Scan any company. Reality Gap score, comp transparency, workforce stability, ghost posting detection." },
              { eyebrow: "New", color: "#f0c040", bg: "rgba(240,192,64,0.12)", border: "rgba(240,192,64,0.3)", title: "Work DNA Quiz", body: "7 questions that reveal what kind of worker you are and which signals matter most for your decisions." },
              { eyebrow: "April", color: "#47ffb3", bg: "rgba(71,255,179,0.12)", border: "rgba(71,255,179,0.3)", title: "Insider Score", body: "See whether leadership got there on merit — or on who they know. Sourced from SEC proxy statements and public filings." },
            ].map((card) => (
              <div key={card.title} style={{ background: "#13121a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: card.color, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 20, padding: "3px 12px", marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                  {card.eyebrow}
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0ebe0", marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#b8b4a8", lineHeight: 1.6, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          {/* Section 5 — Jackye */}
          <div style={{
            background: "#13121a",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "48px 32px",
            maxWidth: 600,
            margin: "56px auto 0",
            textAlign: "center",
            borderRadius: 16,
            width: "100%",
          }}>
            <span style={{ fontSize: 48, color: "#f0c040", lineHeight: 1, display: "block", marginBottom: 8 }}>"</span>
            <p style={{ fontSize: 17, fontWeight: 400, fontStyle: "italic", color: "#b8b4a8", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
              I've spent 15+ years building the hiring machines for the biggest names in tech. I know exactly where the ghost jobs hide and where the real budget lives. I built WDIWF to put that power in your hands — not just employers'.
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#f0ebe0", marginTop: 16 }}>— Jackye Clayton, Founder</p>
          </div>

          {/* Footer */}
          <footer style={{ fontSize: 12, color: "#3d3a4a", textAlign: "center", padding: "48px 24px 24px" }}>
            © 2026 Who Do I Work For? — wdiwf.jackyeclayton.com ·{" "}
            <Link to="/privacy" style={{ color: "#3d3a4a" }}>Privacy</Link> ·{" "}
            <Link to="/terms" style={{ color: "#3d3a4a" }}>Terms</Link>
          </footer>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 560px) {
          .join-form-card { padding: 28px 24px !important; }
          .persona-grid { grid-template-columns: 1fr !important; }
          .proof-sep { display: none; }
          .social-proof-strip { flex-direction: column; gap: 24px !important; }
          .value-cards { grid-template-columns: 1fr !important; }
        }
        .join-form-card input::placeholder { color: #3d3a4a; }
      `}</style>
    </div>
  );
}
