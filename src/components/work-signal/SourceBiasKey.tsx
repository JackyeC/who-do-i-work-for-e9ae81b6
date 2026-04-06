import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "wdiwf-bias-key-open";

const BIAS_COLUMNS = [
  {
    color: "#4a90d9",
    label: "Left-Leaning",
    desc: "Sources with progressive editorial lean. HuffPost, MSNBC, The Guardian, Vox, etc.",
  },
  {
    color: "#a0a0a0",
    label: "Center",
    desc: "Wire services and balanced outlets. AP, Reuters, BBC, NPR, PBS NewsHour, etc.",
  },
  {
    color: "#d94a4a",
    label: "Right-Leaning",
    desc: "Sources with conservative editorial lean. Fox News, Daily Wire, WSJ Opinion, NY Post, etc.",
  },
  {
    color: "#F0C040",
    label: "W? WDIWF View",
    desc: "Our take. Always centrist. Always grounded in public record. Never partisan.",
    glow: true,
  },
];

export function SourceBiasKey() {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  return (
    <section className="border-b border-border/40">
      {/* Gradient top border: blue → gray → red */}
      <div
        className="h-[3px] w-full"
        style={{
          background: "linear-gradient(90deg, #4a90d9, #a0a0a0, #d94a4a)",
        }}
      />

      <div className="max-w-3xl mx-auto px-4">
        {/* Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            How We Read the News
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isOpen && (
          <div className="pb-5 space-y-4">
            {/* 4-column grid (2 on mobile) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BIAS_COLUMNS.map((col) => (
                <div key={col.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: col.color,
                        boxShadow: col.glow
                          ? `0 0 8px ${col.color}80, 0 0 16px ${col.color}40`
                          : undefined,
                      }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {col.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {col.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Promise bar */}
            <div
              className="rounded-lg px-4 py-3 flex gap-3 items-start"
              style={{
                background: "rgba(240, 192, 64, 0.06)",
                border: "1px solid rgba(240, 192, 64, 0.3)",
              }}
            >
              <span className="text-lg shrink-0 mt-0.5">👑</span>
              <p className="text-[11px] text-foreground/80 leading-relaxed">
                <strong>Our Promise:</strong> We pull stories from across the
                political spectrum — left, center, and right — so you see the
                full picture. Every source is tagged for lean. But Who Do I Work
                For? always gives you the centrist, evidence-first view. Our
                takes are grounded in public record — FEC, SEC, OSHA, NLRB, BLS,
                court filings — not partisan framing. We don't pick a side. We
                pull the receipts.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
