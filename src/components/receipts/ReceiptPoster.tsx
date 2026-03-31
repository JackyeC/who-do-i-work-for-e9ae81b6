import { useState } from "react";
import { cn } from "@/lib/utils";

// Import vintage ad poster images
import posterAiTrust from "@/assets/posters/poster-ai-trust.jpg";
import posterLayoffs from "@/assets/posters/poster-layoffs.jpg";
import posterRestructuring from "@/assets/posters/poster-restructuring.jpg";
import posterHealthcare from "@/assets/posters/poster-healthcare.jpg";
import posterStruggling from "@/assets/posters/poster-struggling.jpg";
import posterTrillion from "@/assets/posters/poster-trillion.jpg";

interface PosterData {
  bg: string;
  accent: string;
  dark: string;
  emoji: string;
  bigTxt: string;
  sub: string;
  tag: string;
  copy: string;
  fine: string;
}

interface ReceiptPosterProps {
  poster: PosterData | null | undefined;
  category?: string | null;
  spiceLevel?: number;
  className?: string;
  big?: boolean;
  id?: string;
  headline?: string;
  onClickEnlarge?: () => void;
}

/* Keyword-based image matching: maps headline keywords to vintage ad images */
const POSTER_IMAGE_RULES: { keywords: string[]; image: string; }[] = [
  { keywords: ["nvidia", "trillion", "inference", "orders"], image: posterTrillion },
  { keywords: ["layoff", "cuts", "job cuts", "workforce drop", "plans job"], image: posterLayoffs },
  { keywords: ["restructuring", "fired", "pink slip", "let go"], image: posterRestructuring },
  { keywords: ["healthcare", "hospital", "nurse", "health sector", "job growth"], image: posterHealthcare },
  { keywords: ["struggling", "thriving", "gallup", "miserable", "wellbeing"], image: posterStruggling },
  { keywords: ["ai", "algorithm", "artificial intelligence", "automation", "robot", "machine learning"], image: posterAiTrust },
];

/* Category-based fallback images */
const CATEGORY_IMAGES: Record<string, string> = {
  ai_workplace: posterAiTrust,
  layoffs: posterLayoffs,
  future_of_work: posterStruggling,
};

function matchPosterImage(headline: string | undefined, category: string | null): string | null {
  const h = (headline || "").toLowerCase();
  for (const rule of POSTER_IMAGE_RULES) {
    if (rule.keywords.some((kw) => h.includes(kw))) return rule.image;
  }
  return CATEGORY_IMAGES[category || ""] || posterAiTrust;
}

export function ReceiptPoster({ category, className, big = false, id = "", headline, onClickEnlarge }: ReceiptPosterProps) {
  const [hover, setHover] = useState(false);
  const posterImage = matchPosterImage(headline, category ?? null);

  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: onClickEnlarge ? "pointer" : "default" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClickEnlarge}
    >
      <div
        id={id || undefined}
        className={cn("flex-shrink-0 overflow-hidden rounded-lg relative", className)}
        style={{
          width: big ? 420 : 300,
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        }}
      >
        <img
          src={posterImage!}
          alt={headline || "The Receipts poster"}
          loading="lazy"
          className="w-full h-auto block"
          style={{
            filter: "contrast(1.05) saturate(0.92) sepia(0.08)",
          }}
        />
        {/* Vintage paper overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,248,230,0.12) 0%, rgba(0,0,0,0.08) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        {/* Aged edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.25)",
          }}
        />
        {/* WDIWF brand watermark */}
        <div
          className="absolute bottom-2 left-0 right-0 text-center pointer-events-none"
          style={{
            fontSize: big ? 10 : 8,
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.6)",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            textTransform: "uppercase",
          }}
        >
          THE RECEIPTS × WDIWF
        </div>
      </div>

      {/* Hover overlay: click to enlarge */}
      {onClickEnlarge && (
        <div
          className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2 transition-opacity duration-150"
          style={{
            background: "rgba(0,0,0,0.52)",
            opacity: hover ? 1 : 0,
            pointerEvents: hover ? "auto" : "none",
          }}
        >
          <span style={{ fontSize: 26 }}>🔍</span>
          <span className="font-bold text-white" style={{ fontSize: 13, letterSpacing: "0.05em" }}>Click to enlarge + share</span>
        </div>
      )}
    </div>
  );
}
