import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { scanForCodeWords, type CodeWordEntry, type CodeWordSeverity } from "@/lib/code-word-dictionary";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG: Record<CodeWordSeverity, { label: string; className: string }> = {
  flag: { label: "FLAG", className: "bg-destructive/10 text-destructive border-destructive/30" },
  watch: { label: "WATCH", className: "bg-civic-yellow/10 text-civic-yellow border-civic-yellow/30" },
  note: { label: "NOTE", className: "bg-muted text-muted-foreground border-border" },
};

interface CodeWordScannerProps {
  companyId: string;
  companyName: string;
}

export function CodeWordScanner({ companyId, companyName }: CodeWordScannerProps) {
  // Pull job descriptions
  const { data: jobs } = useQuery({
    queryKey: ["company-jobs-codewords", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_jobs")
        .select("title, description")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .limit(50);
      return data || [];
    },
  });

  // Pull public stances
  const { data: stances } = useQuery({
    queryKey: ["company-stances-codewords", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_public_stances")
        .select("topic, public_position")
        .eq("company_id", companyId)
        .limit(30);
      return data || [];
    },
  });

  const results = useMemo(() => {
    const all: { source: string; sourceDetail: string; entry: CodeWordEntry & { matchedText: string } }[] = [];

    (jobs || []).forEach((job) => {
      const matches = scanForCodeWords(job.description || "");
      matches.forEach((m) => all.push({ source: "Job Posting", sourceDetail: job.title || "Untitled", entry: m }));
    });

    (stances || []).forEach((s) => {
      const text = `${s.topic || ""} ${s.public_position || ""}`;
      const matches = scanForCodeWords(text);
      matches.forEach((m) => all.push({ source: "Public Stance", sourceDetail: s.topic || "—", entry: m }));
    });

    // Deduplicate by phrase (keep first occurrence)
    const seen = new Set<string>();
    return all.filter((r) => {
      const key = r.entry.phrase.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => {
      const order: Record<CodeWordSeverity, number> = { flag: 0, watch: 1, note: 2 };
      return order[a.entry.severity] - order[b.entry.severity];
    });
  }, [jobs, stances]);

  if (results.length === 0) return null;

  const flagCount = results.filter((r) => r.entry.severity === "flag").length;
  const watchCount = results.filter((r) => r.entry.severity === "watch").length;

  return (
    <div className="border border-border/40 bg-card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSearch className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-sm font-bold text-foreground">Culture Signal Scanner</p>
            <p className="text-xs text-muted-foreground">
              {results.length} phrase{results.length !== 1 ? "s" : ""} flagged in {companyName} materials
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {flagCount > 0 && (
            <Badge className="bg-destructive/10 text-destructive border border-destructive/30 text-xs">
              {flagCount} flag{flagCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {watchCount > 0 && (
            <Badge className="bg-civic-yellow/10 text-civic-yellow border border-civic-yellow/30 text-xs">
              {watchCount} watch
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Severity</th>
              <th className="px-4 py-2 text-left font-medium">Phrase</th>
              <th className="px-4 py-2 text-left font-medium">Category</th>
              <th className="px-4 py-2 text-left font-medium">Source</th>
              <th className="px-4 py-2 text-left font-medium">Risk Signal</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const cfg = SEVERITY_CONFIG[r.entry.severity];
              return (
                <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <span className={cn("inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider border rounded", cfg.className)}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">"{r.entry.phrase}"</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.entry.category}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {r.source}
                    <span className="block text-[10px] text-muted-foreground/60">{r.sourceDetail}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{r.entry.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-6 py-3 text-[10px] text-muted-foreground border-t border-border/20">
        Flagged phrases are identified from legal research on bias indicators in hiring materials.
        Presence of a phrase does not prove discrimination — it identifies patterns worth investigating.
      </p>
    </div>
  );
}
