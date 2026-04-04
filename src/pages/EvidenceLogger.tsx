import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { EvidenceLogForm } from "@/components/evidence-logger/EvidenceLogForm";
import { EvidenceLogTable } from "@/components/evidence-logger/EvidenceLogTable";
import { Badge } from "@/components/ui/badge";
import { FileText, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function EvidenceLogger() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Helmet>
        <title>Evidence Logger | WDIWF</title>
        <meta name="description" content="Document workplace incidents with structured fields. Remove emotion, build evidence, protect yourself." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-black text-foreground tracking-tight">Evidence Logger</h1>
          <Badge className="bg-primary/10 text-primary text-[9px] font-bold">BETA</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Employment is a business transaction, not a family. Document what happens. Receipts matter.
        </p>

        {/* Disclaimer */}
        <div className="border border-civic-yellow/30 bg-civic-yellow/5 px-4 py-3 mb-6">
          <p className="text-xs text-muted-foreground">
            Your entries are private and encrypted. Only you can see them.
            This is not legal advice. If you believe you are experiencing discrimination or retaliation,{" "}
            <Link to="/unfair-vs-illegal" className="text-primary underline">use the triage tool</Link> and consult an employment attorney.
          </p>
        </div>

        {/* Form */}
        <EvidenceLogForm onSaved={() => setRefreshKey((k) => k + 1)} />

        {/* Log table */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Your Evidence Log</p>
          <EvidenceLogTable refreshKey={refreshKey} />
        </div>
      </div>
    </>
  );
}
