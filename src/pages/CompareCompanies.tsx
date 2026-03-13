import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Search, ArrowRight, Linkedin, Link2, Check, ArrowLeftRight, Shield, TrendingUp, Users, Eye, DollarSign, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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

function scoreBand(score: number) {
  if (score >= 80) return { label: "High Clarity", color: "text-civic-green", bg: "bg-civic-green/10" };
  if (score >= 60) return { label: "Moderate", color: "text-civic-yellow", bg: "bg-civic-yellow/10" };
  if (score >= 40) return { label: "Low Clarity", color: "text-civic-red", bg: "bg-civic-red/10" };
  return { label: "Opaque", color: "text-civic-red", bg: "bg-civic-red/10" };
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const METRICS = [
  { key: "civic_footprint_score", label: "Employer Clarity Score", icon: Shield, format: (v: number) => `${v}/100`, compare: "higher" },
  { key: "total_pac_spending", label: "PAC Spending", icon: Landmark, format: formatCurrency, compare: "lower" },
  { key: "lobbying_spend", label: "Lobbying Spend", icon: DollarSign, format: (v: number) => v ? formatCurrency(v) : "None reported", compare: "lower" },
  { key: "government_contracts", label: "Gov. Contracts", icon: TrendingUp, format: (v: number) => v ? formatCurrency(v) : "None", compare: "neutral" },
] as const;

export default function CompareCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [companyA, setCompanyA] = useState<CompanyData | null>(null);
  const [companyB, setCompanyB] = useState<CompanyData | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [suggestionsA, setSuggestionsA] = useState<CompanyData[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<CompanyData[]>([]);
  const [copied, setCopied] = useState(false);

  const slugA = searchParams.get("a");
  const slugB = searchParams.get("b");

  usePageSEO({
    title: companyA && companyB
      ? `${companyA.name} vs ${companyB.name} — Employer Intelligence Comparison`
      : "Compare Employers — Who Do I Work For?",
    description: companyA && companyB
      ? `Side-by-side employer transparency comparison: ${companyA.name} (${companyA.civic_footprint_score}/100) vs ${companyB.name} (${companyB.civic_footprint_score}/100). PAC spending, lobbying, government contracts.`
      : "Compare two employers side-by-side on transparency, political spending, and workforce signals.",
    path: `/compare${slugA && slugB ? `?a=${slugA}&b=${slugB}` : ""}`,
  });

  // Load companies from slugs
  useEffect(() => {
    if (slugA) {
      supabase.from("companies").select("id, name, slug, industry, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, state").eq("slug", slugA).single()
        .then(({ data }) => { if (data) setCompanyA(data); });
    }
    if (slugB) {
      supabase.from("companies").select("id, name, slug, industry, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, state").eq("slug", slugB).single()
        .then(({ data }) => { if (data) setCompanyB(data); });
    }
  }, [slugA, slugB]);

  // Search suggestions
  const searchCompanies = async (query: string, setter: (d: CompanyData[]) => void) => {
    if (query.length < 2) { setter([]); return; }
    const { data } = await supabase.from("companies")
      .select("id, name, slug, industry, civic_footprint_score, total_pac_spending, lobbying_spend, government_contracts, employee_count, state")
      .ilike("name", `%${query}%`).limit(5);
    setter(data || []);
  };

  const selectCompany = (company: CompanyData, side: "a" | "b") => {
    if (side === "a") { setCompanyA(company); setSearchA(""); setSuggestionsA([]); }
    else { setCompanyB(company); setSearchB(""); setSuggestionsB([]); }
    const params = new URLSearchParams(searchParams);
    params.set(side, company.slug);
    setSearchParams(params);
  };

  const shareUrl = `${window.location.origin}/compare?a=${companyA?.slug || ""}&b=${companyB?.slug || ""}`;
  const shareText = companyA && companyB
    ? `${companyA.name} vs ${companyB.name}: Who's more transparent? Compare employer intelligence scores side by side.`
    : "Compare two employers side-by-side on transparency and accountability.";

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=500");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Comparison link copied!" });
  };

  const renderCompanySearch = (side: "a" | "b") => {
    const search = side === "a" ? searchA : searchB;
    const suggestions = side === "a" ? suggestionsA : suggestionsB;
    const setSearch = side === "a" ? setSearchA : setSearchB;
    const setSuggestions = side === "a" ? setSuggestionsA : setSuggestionsB;

    return (
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="Search employer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); searchCompanies(e.target.value, setSuggestions); }}
            className="font-mono text-xs"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border shadow-lg">
            {suggestions.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCompany(c, side)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center justify-between"
              >
                <span className="text-foreground font-medium">{c.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{c.civic_footprint_score}/100</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getMetricWinner = (key: string, compare: string) => {
    if (!companyA || !companyB) return null;
    const valA = (companyA as any)[key] || 0;
    const valB = (companyB as any)[key] || 0;
    if (compare === "higher") return valA > valB ? "a" : valB > valA ? "b" : null;
    if (compare === "lower") return valA < valB ? "a" : valB < valA ? "b" : null;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-16 py-12 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-3">
            Employer Intelligence
          </div>
          <h1 className="text-2xl lg:text-[clamp(2rem,4vw,3rem)] mb-3 text-foreground">
            {companyA && companyB
              ? <>{companyA.name} <span className="text-primary">vs</span> {companyB.name}</>
              : <>Compare Employers</>
            }
          </h1>
          <p className="text-muted-foreground max-w-[500px] mx-auto text-[13px]">
            Side-by-side transparency comparison. Same data sources. Same scoring. You decide.
          </p>
        </div>

        {/* Search selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start mb-12">
          <div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mb-2">Employer A</div>
            {companyA ? (
              <div className="bg-card border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="font-serif text-lg text-foreground">{companyA.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{companyA.industry} · {companyA.state}</div>
                </div>
                <button onClick={() => { setCompanyA(null); const p = new URLSearchParams(searchParams); p.delete("a"); setSearchParams(p); }} className="text-muted-foreground hover:text-foreground text-xs">Change</button>
              </div>
            ) : renderCompanySearch("a")}
          </div>

          <div className="flex items-center justify-center pt-6">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>

          <div>
            <div className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground mb-2">Employer B</div>
            {companyB ? (
              <div className="bg-card border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="font-serif text-lg text-foreground">{companyB.name}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">{companyB.industry} · {companyB.state}</div>
                </div>
                <button onClick={() => { setCompanyB(null); const p = new URLSearchParams(searchParams); p.delete("b"); setSearchParams(p); }} className="text-muted-foreground hover:text-foreground text-xs">Change</button>
              </div>
            ) : renderCompanySearch("b")}
          </div>
        </div>

        {/* Comparison table */}
        {companyA && companyB && (
          <>
            {/* Score headline */}
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-8">
              {[companyA, companyB].map((c) => {
                const band = scoreBand(c.civic_footprint_score);
                return (
                  <div key={c.id} className="bg-card p-6 text-center">
                    <div className="font-serif text-lg mb-1 text-foreground">{c.name}</div>
                    <div className="font-data text-5xl font-bold text-foreground mb-1">{c.civic_footprint_score}</div>
                    <div className={`font-mono text-[10px] tracking-wider uppercase ${band.color} inline-block px-2 py-0.5 ${band.bg}`}>
                      {band.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Metric rows */}
            <div className="flex flex-col gap-px bg-border border border-border mb-8">
              {METRICS.map(({ key, label, icon: Icon, format, compare }) => {
                const winner = getMetricWinner(key, compare);
                const valA = (companyA as any)[key] || 0;
                const valB = (companyB as any)[key] || 0;
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto_1fr] bg-card">
                    <div className={`p-4 text-right ${winner === "a" ? "bg-civic-green/[0.05]" : ""}`}>
                      <span className={`font-data text-lg font-bold ${winner === "a" ? "text-civic-green" : "text-foreground"}`}>
                        {format(valA)}
                      </span>
                    </div>
                    <div className="px-4 flex items-center gap-2 border-x border-border min-w-[180px]">
                      <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                      <span className="font-mono text-[9px] tracking-wider uppercase text-muted-foreground">{label}</span>
                    </div>
                    <div className={`p-4 ${winner === "b" ? "bg-civic-green/[0.05]" : ""}`}>
                      <span className={`font-data text-lg font-bold ${winner === "b" ? "text-civic-green" : "text-foreground"}`}>
                        {format(valB)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Share bar */}
            <div className="bg-card border border-border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-primary mb-1">Share this comparison</div>
                <div className="text-[13px] text-muted-foreground">
                  Think someone's choosing between these two? Send them the data.
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={shareLinkedIn} size="sm" className="gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white">
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </Button>
                <Button onClick={copyLink} variant="outline" size="sm" className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Deep links */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[companyA, companyB].map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/company/${c.id}`)}
                  className="bg-card border border-border p-4 text-left hover:border-primary/30 transition-colors group"
                >
                  <div className="font-serif text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</div>
                  <div className="flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-primary mt-1">
                    Full intelligence report <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Empty state prompts */}
        {(!companyA || !companyB) && (
          <div className="text-center py-16 border border-dashed border-border bg-card">
            <ArrowLeftRight className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <div className="font-serif text-lg text-foreground mb-2">Select two employers to compare</div>
            <p className="text-[13px] text-muted-foreground max-w-[400px] mx-auto">
              Search and select both employers above. The comparison generates a unique shareable URL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
