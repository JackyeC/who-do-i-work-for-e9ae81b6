import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export function PersonaQuizBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("wdiwf_banner_dismissed") === "true"; } catch { return false; }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("wdiwf_banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div
      className="relative flex items-center justify-between gap-4 px-5 py-4 mb-6 rounded-lg"
      style={{
        background: "#1a1826",
        borderLeft: "3px solid #f0c040",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeftColor: "#f0c040",
        borderLeftWidth: "3px",
      }}
    >
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#f0ebe0" }}>
          Get your personalized intelligence lens — takes 60 seconds.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/quiz"
          className="inline-flex items-center gap-1 rounded-full px-5 py-2 text-xs font-semibold transition-colors"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            background: "#f0c040",
            color: "#0a0a0e",
          }}
        >
          Start the quiz →
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
      </div>
    </div>
  );
}
