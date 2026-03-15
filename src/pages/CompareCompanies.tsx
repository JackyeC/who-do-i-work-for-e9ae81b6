import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { CompareHeader } from "@/components/compare/CompareHeader";
import { CompanySelector } from "@/components/compare/CompanySelector";
import { ScoreShowdown } from "@/components/compare/ScoreShowdown";
import { MetricBattle } from "@/components/compare/MetricBattle";
import { CompareShareBar } from "@/components/compare/CompareShareBar";

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  industry: string;
  civic_footprint_score: number;
  total_pac_spending: number;
  lobbying_spend: number | null;
  government_contracts: number | null;
  employee_count: string | null;
  state: string;
}

const COMPANY_FIELDS = "id, name, slug, industry, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, state";

export default function CompareCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [companyA, setCompanyA] = useState<CompanyData | null>(null);
  const [companyB, setCompanyB] = useState<CompanyData | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [suggestionsA, setSuggestionsA] = useState<CompanyData[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<CompanyData[]>([]);

  const slugA = searchParams.get("a");
  const slugB = searchParams.get("b");

  usePageSEO({
    title: companyA && companyB
      ? `${companyA.name} vs ${companyB.name} — Employer Intelligence Comparison`
      : "Compare Employers — Who Do I Work For?",
    description: companyA && companyB
      ? `Side-by-side employer transparency comparison: ${companyA.name} (${companyA.civic_footprint_score}/100) vs ${companyB.name} (${companyB.civic_footprint_score}/100).`
      : "Compare two employers side-by-side on transparency, political spending, and workforce signals.",
    path: `/compare${slugA && slugB ? `?a=${slugA}&b=${slugB}` : ""}`,
  });

  useEffect(() => {
    if (slugA) {
      supabase.from("companies").select(COMPANY_FIELDS).eq("slug", slugA).single()
        .then(({ data }) => { if (data) setCompanyA(data); });
    }
    if (slugB) {
      supabase.from("companies").select(COMPANY_FIELDS).eq("slug", slugB).single()
        .then(({ data }) => { if (data) setCompanyB(data); });
    }
  }, [slugA, slugB]);

  const searchCompanies = async (query: string, setter: (d: CompanyData[]) => void) => {
    if (query.length < 2) { setter([]); return; }
    const { data } = await supabase.from("companies").select(COMPANY_FIELDS).ilike("name", `%${query}%`).limit(5);
    setter(data || []);
  };

  const selectCompany = (company: CompanyData, side: "a" | "b") => {
    if (side === "a") { setCompanyA(company); setSearchA(""); setSuggestionsA([]); }
    else { setCompanyB(company); setSearchB(""); setSuggestionsB([]); }
    const params = new URLSearchParams(searchParams);
    params.set(side, company.slug);
    setSearchParams(params);
  };

  const clearCompany = (side: "a" | "b") => {
    if (side === "a") setCompanyA(null);
    else setCompanyB(null);
    const p = new URLSearchParams(searchParams);
    p.delete(side);
    setSearchParams(p);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-16 py-12 lg:py-20">
        <CompareHeader nameA={companyA?.name} nameB={companyB?.name} />

        {/* Company selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-12">
          <CompanySelector
            label="Employer A"
            company={companyA}
            search={searchA}
            suggestions={suggestionsA}
            onSearchChange={(v) => { setSearchA(v); searchCompanies(v, setSuggestionsA); }}
            onSelect={(c) => selectCompany(c, "a")}
            onClear={() => clearCompany("a")}
          />
          <div className="flex items-center justify-center pt-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
            </div>
          </div>
          <CompanySelector
            label="Employer B"
            company={companyB}
            search={searchB}
            suggestions={suggestionsB}
            onSearchChange={(v) => { setSearchB(v); searchCompanies(v, setSuggestionsB); }}
            onSelect={(c) => selectCompany(c, "b")}
            onClear={() => clearCompany("b")}
          />
        </div>

        {/* Results */}
        {companyA && companyB && (
          <>
            <ScoreShowdown companyA={companyA} companyB={companyB} />
            <MetricBattle companyA={companyA} companyB={companyB} />
            <CompareShareBar
              nameA={companyA.name}
              nameB={companyB.name}
              slugA={companyA.slug}
              slugB={companyB.slug}
              scoreA={companyA.civic_footprint_score}
              scoreB={companyB.civic_footprint_score}
            />

            {/* Deep links */}
            <div className="grid grid-cols-2 gap-4">
              {[companyA, companyB].map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/company/${c.slug}`)}
                  className="bg-card border border-border p-5 text-left hover:border-primary/30 transition-all group"
                >
                  <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                  <div className="flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-primary mt-2">
                    Full intelligence report <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {(!companyA || !companyB) && (
          <div className="text-center py-16 border border-dashed border-border bg-card">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <div className="font-bold text-lg text-foreground mb-2">Select two employers to compare</div>
            <p className="text-[13px] text-muted-foreground max-w-[400px] mx-auto">
              Search and select both employers above. The comparison generates a unique shareable URL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
