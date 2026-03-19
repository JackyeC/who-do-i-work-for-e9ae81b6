import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface CompanyResult {
  id: string;
  name: string;
  slug: string;
  industry: string;
  state: string;
  civic_footprint_score: number;
  career_intelligence_score: number | null;
  total_pac_spending: number;
  lobbying_spend: number | null;
  employee_count: string | null;
  confidence_rating: string;
  record_status: string;
  /** Curated dossier fields (populated when available) */
  dossier?: {
    score: number;
    risk_level: string;
    confidence: string;
    insights: string[];
    fit_signals: string[];
    risk_signals: string[];
    bottom_line: string | null;
    sources_note: string | null;
  };
}

interface EmployerDossierSearchProps {
  onSelect: (company: CompanyResult) => void;
  selectedCompany: CompanyResult | null;
  onNotFound?: (name: string) => void;
}

export function EmployerDossierSearch({ onSelect, selectedCompany }: EmployerDossierSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const { data } = await supabase
      .from("companies")
      .select("id, name, slug, industry, state, civic_footprint_score, career_intelligence_score, total_pac_spending, lobbying_spend, employee_count, confidence_rating, record_status")
      .ilike("name", `%${value.trim()}%`)
      .limit(8);
    setResults((data as CompanyResult[]) || []);
    setLoading(false);
  };

  const handleSelect = async (company: CompanyResult) => {
    // Fetch dossier if available
    const { data: dossier } = await supabase
      .from("company_dossiers")
      .select("score, risk_level, confidence, insights, fit_signals, risk_signals, bottom_line, sources_note")
      .eq("company_id", company.id)
      .maybeSingle();

    const enriched: CompanyResult = dossier
      ? { ...company, dossier: dossier as CompanyResult["dossier"] }
      : company;

    onSelect(enriched);
    setQuery(company.name);
    setOpen(false);
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search any employer to generate an Employer Dossier…"
          className="pl-10 h-12 text-base"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-elevated overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0"
              onMouseDown={() => handleSelect(c)}
            >
              <span className="font-semibold text-foreground">{c.name}</span>
              <span className="text-xs text-muted-foreground ml-2">{c.industry} · {c.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { CompanyResult };
