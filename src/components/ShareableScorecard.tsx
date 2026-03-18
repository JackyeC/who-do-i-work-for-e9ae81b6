import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Share2, Download, Copy, Check, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, getFootprintLabel } from "@/data/sampleData";

interface ScorecardData {
  name: string;
  industry: string;
  state: string;
  civicFootprintScore: number;
  totalPacSpending: number;
  lobbyingSpend?: number;
  confidenceRating: string;
  governmentContracts?: number;
  partyBreakdown?: { party: string; amount: number; color: string }[];
}

function getFootprintColor(score: number) {
  if (score >= 75) return "#dc2626";
  if (score >= 50) return "#d97706";
  if (score >= 25) return "#2563eb";
  return "#16a34a";
}

function ScorecardCanvas({ data }: { data: ScorecardData }) {
  const footprintLabel = getFootprintLabel(data.civicFootprintScore);
  const footprintColor = getFootprintColor(data.civicFootprintScore);
  const scorePercent = data.civicFootprintScore / 100;

  return (
    <div
      id="scorecard-render"
      style={{
        width: 600,
        padding: 40,
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        fontFamily: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
        color: "#1e293b",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />

      {/* Header */}
      <div style={{ position: "relative", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ClipboardCheck style={{ width: 14, height: 14, color: "white" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", letterSpacing: 0.5 }}>
              OFFER CHECK
            </span>
            <span style={{ fontSize: 9, color: "#94a3b8" }}>by Jackye Clayton</span>
          </div>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          {data.name}
        </h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99,
            background: "#e2e8f0", color: "#475569", fontWeight: 500,
          }}>{data.industry}</span>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99,
            background: "#e2e8f0", color: "#475569", fontWeight: 500,
          }}>{data.state}</span>
        </div>
      </div>

      {/* Score + signals */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", position: "relative" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <svg width={120} height={120} viewBox="0 0 120 120">
            <circle cx={60} cy={60} r={52} fill="none" stroke="#e2e8f0" strokeWidth={8} />
            <circle
              cx={60} cy={60} r={52} fill="none"
              stroke={footprintColor} strokeWidth={8}
              strokeDasharray={`${scorePercent * 327} 327`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x={60} y={54} textAnchor="middle" fontSize={28} fontWeight={700} fill="#1e293b">
              {data.civicFootprintScore}
            </text>
            <text x={60} y={72} textAnchor="middle" fontSize={11} fill="#64748b">
              / 100
            </text>
          </svg>
          <div style={{
            marginTop: 6, fontSize: 12, fontWeight: 600,
            color: footprintColor, textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            {footprintLabel.label}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            KEY SIGNALS DETECTED
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SignalItem label="PAC Spending" value={data.totalPacSpending > 0 ? formatCurrency(data.totalPacSpending) : "None"} />
            <SignalItem label="Lobbying" value={data.lobbyingSpend ? formatCurrency(data.lobbyingSpend) : "None"} />
            <SignalItem label="Gov Contracts" value={data.governmentContracts ? formatCurrency(data.governmentContracts) : "N/A"} />
            <SignalItem label="Confidence" value={data.confidenceRating.charAt(0).toUpperCase() + data.confidenceRating.slice(1)} />
          </div>

          {data.partyBreakdown && data.partyBreakdown.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                PAC BY PARTY
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "#e2e8f0" }}>
                {(() => {
                  const total = data.partyBreakdown.reduce((s, p) => s + p.amount, 0);
                  return data.partyBreakdown.map((p, i) => (
                    <div key={i} style={{ width: `${(p.amount / total) * 100}%`, background: p.color }} />
                  ));
                })()}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                {data.partyBreakdown.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                    <div style={{ width: 6, height: 6, borderRadius: 99, background: p.color }} />
                    {p.party}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 28, paddingTop: 16,
        borderTop: "1px solid #cbd5e1",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          Offer Check by Jackye Clayton • offercheck.app
        </span>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          Generated {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function SignalItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{value}</div>
    </div>
  );
}

export function ShareableScorecard({ data }: { data: ScorecardData }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async (): Promise<HTMLCanvasElement | null> => {
    const el = document.getElementById("scorecard-render");
    if (!el) return null;
    return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${data.name.toLowerCase().replace(/\s+/g, "-")}-offer-check.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Offer Check downloaded" });
  };

  const handleCopy = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Offer Check copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Try downloading instead.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    );
    const file = new File([blob], `${data.name}-offer-check.png`, { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${data.name} — Offer Check by Jackye Clayton`,
        text: `I ran the Offer Check on ${data.name}. Review the signals before you say yes.`,
        files: [file],
      });
    } else {
      const text = encodeURIComponent(
        `I ran the Offer Check on ${data.name}. Know before you go 🔍\n\nhttps://civic-align.lovable.app/company/${data.name.toLowerCase().replace(/\s+/g, "-")}`
      );
      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          Share Offer Check
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Offer Check — {data.name}</DialogTitle>
        </DialogHeader>

        <div ref={cardRef} className="overflow-auto">
          <ScorecardCanvas data={data} />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy Image"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </Button>
          <Button size="sm" onClick={handleShare} className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}