import { useState, useRef } from "react";
import { Download, Share2, Linkedin, Twitter, Link2, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface Signal {
  label: string;
}

interface WorkplaceDNAShareCardProps {
  archetypeName: string;
  archetypeSubtitle: string;
  signals: Signal[];
  onClose?: () => void;
}

/**
 * Beautiful, shareable Workplace DNA card component
 * Renders a branded card showing archetype info with download & social share capabilities
 */
export function WorkplaceDNAShareCard({
  archetypeName,
  archetypeSubtitle,
  signals,
  onClose,
}: WorkplaceDNAShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const BASE_URL = "https://wdiwf.jackyeclayton.com";
  const QUIZ_URL = `${BASE_URL}/quiz`;

  /**
   * Download the card as PNG using html2canvas
   */
  const handleDownload = async () => {
    if (!cardRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "my-workplace-dna.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Card downloaded",
        description: "Your Workplace DNA card has been saved as PNG",
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

  /**
   * Share to LinkedIn with custom text
   */
  const handleShareLinkedIn = () => {
    const text = `I just discovered my Workplace DNA — I'm ${archetypeName}. What's yours? Take the quiz → ${QUIZ_URL}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(QUIZ_URL)}`;

    window.open(url, "_blank", "width=600,height=600");

    // Also copy to clipboard as LinkedIn doesn't natively support text in share API
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Share to Twitter/X with custom text
   */
  const handleShareTwitter = () => {
    const text = `My Workplace DNA: ${archetypeName} 🧬 What's yours? ${QUIZ_URL}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank", "width=600,height=500");
  };

  /**
   * Copy share link to clipboard
   */
  const handleCopyLink = () => {
    const text = `I just discovered my Workplace DNA — I'm ${archetypeName}. What's yours? Take the quiz → ${QUIZ_URL}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Copied to clipboard",
      description: "Share text copied successfully",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Card Container */}
        <div
          ref={cardRef}
          className="w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#1a1a2e",
            borderLeft: "1px solid rgba(240,192,64,0.2)",
            borderRight: "1px solid rgba(240,192,64,0.2)",
            borderTop: "2px solid rgba(240,192,64,0.3)",
            borderBottom: "1px solid rgba(240,192,64,0.1)",
          }}
        >
          {/* Card Content - padded for the captured image */}
          <div className="p-8">
            {/* Header Badge */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#f0c040",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "16px" }}>W?</span>
              <span>My Workplace DNA</span>
            </div>

            {/* Archetype Name - Prominent */}
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#f0ebe0",
                marginBottom: 12,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                letterSpacing: "-1px",
              }}
            >
              {archetypeName}
            </h2>

            {/* Archetype Subtitle */}
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "rgba(240,235,224,0.7)",
                marginBottom: 28,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              {archetypeSubtitle}
            </p>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, rgba(240,192,64,0.3) 0%, transparent 100%)",
                marginBottom: 24,
              }}
            />

            {/* Key Signals - Just Labels */}
            <div style={{ marginBottom: 28 }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(240,192,64,0.8)",
                  marginBottom: 12,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Key Signals
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {signals.slice(0, 3).map((signal, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#f0c040",
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#f0ebe0",
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {signal.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent 0%, rgba(240,192,64,0.3) 100%)",
                marginBottom: 20,
              }}
            />

            {/* CTA Footer */}
            <div
              style={{
                fontSize: "12px",
                color: "rgba(240,192,64,0.9)",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.05em",
                textAlign: "center",
                paddingTop: 4,
              }}
            >
              Take the quiz → wdiwf.jackyeclayton.com/quiz
            </div>
          </div>
        </div>

        {/* Action Buttons - Below Card */}
        <div
          className="mt-6 flex flex-col gap-3 p-4"
          style={{ backgroundColor: "transparent" }}
        >
          {/* Download Button */}
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
            {downloading ? "Generating..." : "Download Card"}
          </button>

          {/* Share Buttons Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors hover:bg-opacity-10"
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

            {/* Twitter/X */}
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border transition-colors hover:bg-opacity-10"
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

            {/* Copy Link */}
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
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              <span className="text-xs font-medium hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>

          {/* Close Button */}
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
