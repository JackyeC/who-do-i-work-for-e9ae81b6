import { useState, useRef, useEffect } from "react";
import { Download, Linkedin, Twitter, Link2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import logoSquare from "@/assets/wdiwf-logo-square.png";
import logoNav from "@/assets/wdiwf-logo-nav-light.png";

interface FoundingMemberBadgeProps {
  memberName?: string;
  memberNumber?: number;
  joinedDate?: string;
  onClose?: () => void;
}

/**
 * Founding Member shareable badge card
 * Pre-launch signups get a numbered badge they can download & share
 * Uses the real WDIWF logo assets and brand colors
 */
export function FoundingMemberBadge({
  memberName,
  memberNumber,
  joinedDate,
  onClose,
}: FoundingMemberBadgeProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const BASE_URL = "https://wdiwf.jackyeclayton.com";
  const displayNumber = memberNumber
    ? `#${String(memberNumber).padStart(4, "0")}`
    : "#0001";
  const displayName = memberName || "Founding Member";
  const displayDate = joinedDate
    ? new Date(joinedDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Pre-Launch 2026";

  // Pre-load logo images so html2canvas captures them correctly
  useEffect(() => {
    const imgs = [logoSquare, logoNav];
    let loaded = 0;
    imgs.forEach((src) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        loaded++;
        if (loaded === imgs.length) setImagesLoaded(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === imgs.length) setImagesLoaded(true);
      };
      img.src = src;
    });
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0e",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "wdiwf-founding-member.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Badge downloaded",
        description: "Your Founding Member badge has been saved as PNG",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const shareText = `I'm Founding Member ${displayNumber} of Who Do I Work For? — the career intelligence platform that tells you what employers won't. Launching April 7. Get in early → ${BASE_URL}`;

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BASE_URL)}`;
    window.open(url, "_blank", "width=600,height=600");
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `I'm Founding Member ${displayNumber} of @WhoDoIWorkFor — career intelligence that tells you what employers won't. April 7 launch. ${BASE_URL}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=500");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Share text copied — post it anywhere",
    });
  };

  /* ── Brand color tokens (from index.css dark mode) ── */
  const BRAND = {
    gold: "#E6A817",         // civic-gold: hsl(43, 85%, 50%)
    goldBright: "#F0C040",   // dark mode primary: hsl(43, 85%, 59%)
    bg: "#0a0a0e",           // dark mode background
    fg: "#f0ebe0",           // dark mode foreground (warm off-white)
    fgMuted: "rgba(240,235,224,0.6)",
    fgSubtle: "rgba(240,235,224,0.45)",
    goldAlpha20: "rgba(240,192,64,0.2)",
    goldAlpha30: "rgba(240,192,64,0.3)",
    goldAlpha40: "rgba(240,192,64,0.4)",
    goldAlpha60: "rgba(240,192,64,0.6)",
    goldAlpha80: "rgba(240,192,64,0.8)",
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Badge Card (captured for PNG) ── */}
        <div
          ref={cardRef}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: BRAND.bg,
            border: `1px solid ${BRAND.goldAlpha30}`,
            boxShadow: `0 0 60px rgba(240,192,64,0.08), inset 0 1px 0 rgba(240,192,64,0.15)`,
          }}
        >
          <div style={{ padding: "32px 32px 24px" }}>
            {/* Top row: Real logo + member number */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <img
                src={logoNav}
                alt="Who Do I Work For?"
                crossOrigin="anonymous"
                style={{ height: 28, display: "block" }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: BRAND.goldBright,
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                {displayNumber}
              </span>
            </div>

            {/* Center: Square logo icon + FOUNDING MEMBER */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 16px",
                  borderRadius: 16,
                  border: `2px solid ${BRAND.goldAlpha40}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `radial-gradient(circle, rgba(240,192,64,0.08) 0%, transparent 70%)`,
                  overflow: "hidden",
                }}
              >
                <img
                  src={logoSquare}
                  alt="W?"
                  crossOrigin="anonymous"
                  style={{
                    width: 52,
                    height: 52,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: BRAND.goldBright,
                  marginBottom: 8,
                }}
              >
                Founding Member
              </p>

              <h2
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: BRAND.fg,
                  letterSpacing: "-0.5px",
                  marginBottom: 6,
                }}
              >
                {displayName}
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "13px",
                  color: BRAND.fgSubtle,
                }}
              >
                Joined {displayDate}
              </p>
            </div>

            {/* Gold divider */}
            <div
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${BRAND.goldAlpha40} 50%, transparent 100%)`,
                marginBottom: 20,
              }}
            />

            {/* Commitment statement */}
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: 1.7,
                color: BRAND.fgMuted,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              I believe workers deserve the truth about who they work for.
              <br />
              I'm here before the launch because transparency can't wait.
            </p>

            {/* Footer: launch date + URL */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  color: BRAND.goldAlpha60,
                  textTransform: "uppercase",
                }}
              >
                Launch: April 7, 2026
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  color: BRAND.fgSubtle,
                }}
              >
                wdiwf.jackyeclayton.com
              </span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons (not captured in PNG) ── */}
        <div className="mt-6 flex flex-col gap-3 p-4">
          <button
            onClick={handleDownload}
            disabled={downloading || !imagesLoaded}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              background: BRAND.goldBright,
              color: BRAND.bg,
              opacity: downloading ? 0.7 : 1,
              cursor: downloading ? "not-allowed" : "pointer",
            }}
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : !imagesLoaded ? "Loading..." : "Download Badge"}
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: BRAND.goldAlpha30,
                color: BRAND.goldBright,
                background: "transparent",
              }}
              title="Share on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">LinkedIn</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: BRAND.goldAlpha30,
                color: BRAND.goldBright,
                background: "transparent",
              }}
              title="Share on Twitter"
            >
              <Twitter className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Twitter</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: copied ? "rgba(76,175,80,0.5)" : BRAND.goldAlpha30,
                color: copied ? "#4caf50" : BRAND.goldBright,
                background: "transparent",
              }}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              <span className="text-xs font-medium hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                color: BRAND.fgMuted,
                background: "transparent",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
