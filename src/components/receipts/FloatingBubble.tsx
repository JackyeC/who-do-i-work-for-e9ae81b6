import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const JACKYE_ISMS = [
  "The math isn't mathing, and the vibes are tragic.",
  "It's clean. It's tight. It's a good thing.",
  "They always leave something out.",
  "Stop applying. Start aligning.",
  "Every company runs a check on you. We run one on them.",
  "We don't have a bias. We have receipts.",
  "Your offer letter left out the interesting parts.",
  "HR called. They want their narrative back.",
];

export function FloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % JACKYE_ISMS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Speech bubble on hover */}
      {showSpeech && !isOpen && (
        <div
          className="bg-card border border-border rounded-xl px-4 py-3 max-w-[260px] shadow-xl animate-fade-in"
          style={{ fontStyle: "italic", fontSize: 13 }}
        >
          <p className="text-foreground leading-snug">"{JACKYE_ISMS[quoteIdx]}"</p>
          <div
            className="absolute -bottom-1.5 right-8 w-3 h-3 rotate-45 bg-card border-r border-b border-border"
          />
        </div>
      )}

      {/* Slide-in CTA menu */}
      {isOpen && (
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 w-[280px] animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary font-bold">JRC EDIT</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            <Link
              to="/advisory"
              onClick={() => setIsOpen(false)}
              className="block w-full p-3 rounded-lg border border-primary/30 text-center font-bold text-sm text-primary hover:bg-primary/5 transition-colors no-underline"
            >
              Audit My Stack
            </Link>
            <Link
              to="/search"
              onClick={() => setIsOpen(false)}
              className="block w-full p-3 rounded-lg border border-border text-center font-bold text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
            >
              Solve My Puzzle
            </Link>
            <a
              href="https://substack.com/@jackyeclayton"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-3 rounded-lg border border-border text-center font-bold text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
            >
              Join My Circle
            </a>
          </div>
        </div>
      )}

      {/* Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowSpeech(true)}
        onMouseLeave={() => setShowSpeech(false)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl transition-transform hover:scale-110",
          "ring-2 ring-offset-2 ring-offset-background",
          isOpen ? "ring-primary" : "ring-primary/60 animate-[pulse_3s_ease-in-out_infinite]"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
        }}
        aria-label="Open JRC EDIT menu"
      >
        👑
      </button>
    </div>
  );
}
