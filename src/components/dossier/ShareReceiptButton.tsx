/**
 * ShareReceiptButton — Generates a branded shareable image for a signal finding.
 * Uses html2canvas to capture a styled card, then opens native share or downloads.
 */
import { useState, useRef, useCallback } from "react";
import { Share2, Download, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface ShareReceiptButtonProps {
  title: string;
  description: string;
  source: string;
  companyName?: string;
  amount?: number | null;
  date?: string | null;
  dossierUrl?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function ShareReceiptButton({
  title, description, source, companyName, amount, date, dossierUrl,
}: ShareReceiptButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0F1118",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );

      // Try native share first
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "receipt.png", { type: "image/png" })] })) {
        await navigator.share({
          title: `${title} — WDIWF Receipt`,
          text: `${description}\n\nVerify at ${dossierUrl || "whodoimworkfor.com"}`,
          files: [new File([blob], "wdiwf-receipt.png", { type: "image/png" })],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wdiwf-receipt-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setDone(true);
      toast.success("Receipt ready to share");
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error("Share receipt failed:", e);
      toast.error("Could not generate receipt image");
    } finally {
      setGenerating(false);
    }
  }, [title, description, dossierUrl]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={generate}
        disabled={generating}
        className="gap-1.5 text-[10px] h-7 px-2 text-muted-foreground hover:text-primary"
      >
        {generating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : done ? (
          <Check className="w-3 h-3 text-primary" />
        ) : (
          <Share2 className="w-3 h-3" />
        )}
        {done ? "Shared" : "Share Receipt"}
      </Button>

      {/* Hidden branded card for capture */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <div
          ref={cardRef}
          style={{
            width: 600,
            padding: 32,
            background: "linear-gradient(180deg, #0F1118 0%, #171B25 100%)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F2C14E" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#F2C14E" }}>
                WDIWF RECEIPT
              </span>
            </div>
            {companyName && (
              <span style={{ fontSize: 11, color: "#B9C0CC", fontWeight: 600 }}>{companyName}</span>
            )}
          </div>

          {/* Title */}
          <div style={{ fontSize: 22, fontWeight: 900, color: "#F5F1E8", marginBottom: 8, lineHeight: 1.3 }}>
            {title}
          </div>

          {/* Amount + Date */}
          {(amount || date) && (
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {amount != null && amount > 0 && (
                <span style={{ fontSize: 18, fontWeight: 800, color: "#FF6B6B" }}>
                  {formatCurrency(amount)}
                </span>
              )}
              {date && (
                <span style={{ fontSize: 12, color: "#B9C0CC", alignSelf: "flex-end" }}>
                  {new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div style={{
            fontSize: 14, color: "#D4CFC5", lineHeight: 1.6, marginBottom: 20,
            padding: 16, background: "#1E222C", borderRadius: 12, border: "1px solid #ffffff08",
          }}>
            {description}
          </div>

          {/* Source */}
          <div style={{ fontSize: 10, color: "#B9C0CC80", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 24 }}>
            📎 Source: {source}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 16, borderTop: "1px solid #ffffff08",
          }}>
            <span style={{ fontSize: 11, color: "#B9C0CC60" }}>
              Verify at whodoimworkfor.com
            </span>
            <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase" as const, color: "#B9C0CC40", fontWeight: 300, fontStyle: "italic" }}>
              Public records · Not opinions
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
