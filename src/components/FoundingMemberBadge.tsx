import { useState, useRef } from "react";
import { Download, Share2, Linkedin, Twitter, Link2, Check, X, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface FoundingMemberBadgeProps {
  memberName?: string;
  memberNumber?: number;
  joinedDate?: string;
  onClose?: () => void;
}

/**
 * Founding Member shareable badge card
 * Pre-launch signups get a numbered badge they can download & share
 * Creates urgency + social proof for wdiwf.jackyeclayton.com April 6 launch
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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0e",
        scale: 2,
        useCORS: true,
        allowTaint: true,
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

  const shareText = `I'm Founding Member ${displayNumber} of Who Do I Work For? — the career intelligence platform that tells you what employers won't. Launching April 6. Get in early → ${BASE_URL}`;

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BASE_URL)}`;
    window.open(url, "_blank", "width=600,height=600");
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `I'm Founding Member ${displayNumber} of @WhoDoIWorkFor — career intelligence that tells you what employers won't. April 6 launch. ${BASE_URL}`;
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* ── Badge Card (captured for PNG) ── */}
        <div
          ref={cardRef}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#0a0a0e",
            border: "1px solid rgba(240,192,64,0.25)",
            boxShadow: "0 0 60px rgba(240,192,64,0.08), inset 0 1px 0 rgba(240,192,64,0.15)",
          }}
        >
          <div className="p-8 pb-6">
            {/* Top row: W? logo + FOUNDING MEMBER label */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 32,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "#f0c040",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: "16px",
                    color: "#0a0a0e",
                  }}
                >
                  W?
                </div>
                <span
                  style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "rgba(240,235,224,0.8)",
                  }}
                >
                  Who Do I Work For?
                </span>
              </div>

              {/* Member number */}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "#f0c040",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                {displayNumber}
              </span>
            </div>

            {/* Shield icon + FOUNDING MEMBER */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  border: "2px solid rgba(240,192,64,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(circle, rgba(240,192,64,0.1) 0%, transparent 70%)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f0c040"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>

              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#f0c040",
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
                  color: "#f0ebe0",
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
                  color: "rgba(240,235,224,0.5)",
                }}
              >
                Joined {displayDate}
              </p>
            </div>

            {/* Gold divider */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(240,192,64,0.4) 50%, transparent 100%)",
                marginBottom: 20,
              }}
            />

            {/* Commitment statement */}
            <p
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: 1.7,
                color: "rgba(240,235,224,0.65)",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              I believe workers deserve the truth about who they work for.
              <br />
              I'm here before the launch because transparency can't wait.
            </p>

            {/* Footer: launch date + CTA */}
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
                  color: "rgba(240,192,64,0.6)",
                  textTransform: "uppercase",
                }}
              >
                Launch: April 6, 2026
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  color: "rgba(240,235,224,0.4)",
                }}
              >
                wdiwf.jackyeclayton.com
              </span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons (not captured in PNG) ── */}
        <div className="mt-6 flex flex-col gap-3 p-4">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              background: "#f0c040",
              color: "#0a0a0e",
              opacity: downloading ? 0.7 : 1,
              cursor: downloading ? "not-allowed" : "pointer",
            }}
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download Badge"}
          </button>

          {/* Share row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: "rgba(240,192,64,0.3)",
                color: "#f0c040",
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
                borderColor: "rgba(240,192,64,0.3)",
                color: "#f0c040",
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
                borderColor: copied ? "rgba(76,175,80,0.5)" : "rgba(240,192,64,0.3)",
                color: copied ? "#4caf50" : "#f0c040",
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

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-lg border transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                color: "rgba(240,235,224,0.6)",
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
