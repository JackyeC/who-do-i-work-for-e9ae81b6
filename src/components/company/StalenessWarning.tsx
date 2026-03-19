import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface StalenessWarningProps {
  companyName: string;
}

export function StalenessWarning({ companyName }: StalenessWarningProps) {
  return (
    <div
      className="rounded-r-lg mb-3 px-3.5 py-2.5 flex items-start gap-2"
      style={{
        backgroundColor: "rgba(240,192,64,0.08)",
        borderLeft: "3px solid #f0c040",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f0c040" }} />
      <div className="text-xs" style={{ color: "#b8b4a8" }}>
        <p>Some leadership data may be outdated. 8-K departure filings are checked regularly.</p>
        <Link
          to={`/request-correction?company=${encodeURIComponent(companyName)}`}
          className="underline hover:text-primary transition-colors"
        >
          Report a change →
        </Link>
      </div>
    </div>
  );
}
