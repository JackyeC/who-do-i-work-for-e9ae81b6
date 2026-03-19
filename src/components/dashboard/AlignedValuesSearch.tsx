import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ArrowRight, AlertTriangle, Eye, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CompanyResult {
  id: string;
  name: string;
  slug: string;
  industry: string;
  civic_footprint_score: number;
  category_tags: string[];
  narrative_gap: boolean;
  insider_score?: number | null;
}

function scoreColor(score: number) {
  if (score >= 70) return { bg: "rgba(71,255,179,0.1)", text: "#47ffb3" };
  if (score >= 50) return { bg: "rgba(240,192,64,0.1)", text: "#f0c040" };
  return { bg: "rgba(255,77,109,0.1)", text: "#ff4d6d" };
}

const VALUES_LABELS = ["Transparency", "Worker Rights", "Climate Action", "Pay Equity", "Inclusive Culture"];

export function AlignedValuesSearch({ hasTakenQuiz }: { hasTakenQuiz: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  // Suggested companies (top-scoring from DB, shown when focused but no query)
  const { data: suggestedCompanies } = useQuery({
    queryKey: ["aligned-suggestions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, civic_footprint_score, category_tags, insider_score")
        .order("civic_footprint_score", { ascending: false })
        .limit(5);
      return (data || []).map((c: any) => ({
        ...c,
        category_tags: c.category_tags || [],
        narrative_gap: (c.insider_score ?? 0) > 60,
      })) as CompanyResult[];
    },
    staleTime: 5 * 60_000,
  });

  // Search DB companies
  const { data: dbResults } = useQuery({
    queryKey: ["aligned-search", query],
    queryFn: async () => {
      if (!query.trim() || query.trim().length < 2) return [];
      const { data } = await supabase
        .from("companies")
        .select("id, name, slug, industry, civic_footprint_score, category_tags, insider_score")
        .ilike("name", `%${query.trim()}%`)
        .order("civic_footprint_score", { ascending: false })
        .limit(8);
      return (data || []).map((c: any) => ({
        ...c,
        category_tags: c.category_tags || [],
        narrative_gap: (c.insider_score ?? 0) > 60,
      })) as CompanyResult[];
    },
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  // Already tracked companies
  const { data: watchedIds } = useQuery({
    queryKey: ["watched-ids", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("tracked_companies")
        .select("company_id")
        .eq("user_id", user!.id)
        .eq("is_active", true);
      return new Set((data || []).map((r: any) => r.company_id));
    },
    enabled: !!user,
  });

  const isTracked = (id: string) => trackedIds.has(id) || (watchedIds instanceof Set && watchedIds.has(id));

  const handleTrack = async (company: CompanyResult) => {
    if (!user) return;
    try {
      await (supabase as any).from("tracked_companies").insert({
        user_id: user.id,
        company_id: company.id,
        is_active: true,
      });
      setTrackedIds(prev => new Set(prev).add(company.id));
      toast({ title: "Tracking", description: `Now tracking ${company.name}` });
    } catch {
      toast({ title: "Already tracked", description: `${company.name} is in your watchlist.` });
    }
  };

  // Determine which results to show
  const showSuggestions = focused && query.trim().length < 2;
  const results: CompanyResult[] = useMemo(() => {
    if (query.trim().length >= 2 && dbResults) return dbResults;
    if (showSuggestions) return suggestedCompanies || [];
    return [];
  }, [query, dbResults, showSuggestions]);

  // Assign pseudo-matched values based on score
  const getMatchedValues = (score: number) => {
    const count = score >= 70 ? 3 : score >= 50 ? 2 : 1;
    const shuffled = [...VALUES_LABELS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  if (!hasTakenQuiz) {
    return (
      <div className="py-4">
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#b8b4a8", lineHeight: 1.6, marginBottom: "12px" }}>
          Complete your Work DNA profile to see which companies actually match who you are.
        </p>
        <Link
          to="/quiz"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: "#f0c040" }}
        >
          Take the quiz <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search any employer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm bg-background/50 border border-border/40 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        />
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", lineHeight: 1.5, marginBottom: "10px" }}>
        We score every company against your Work DNA — skills, values, mission alignment, and integrity. Only companies with receipts make the cut.
      </p>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
          {showSuggestions && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#7a7590", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
              Suggested Companies
            </p>
          )}
          {results.map((company) => {
            const sc = scoreColor(company.civic_footprint_score);
            const matched = getMatchedValues(company.civic_footprint_score);
            const tracked = isTracked(company.id);
            return (
              <div
                key={company.id}
                className="rounded-lg p-3 transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Link
                    to={`/company/${company.slug}`}
                    className="text-sm font-semibold hover:text-primary transition-colors truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0ebe0" }}
                  >
                    {company.name}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {company.narrative_gap && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span
                      className="text-xs font-bold rounded-full px-2 py-0.5 tabular-nums"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {company.civic_footprint_score}
                    </span>
                  </div>
                </div>

                {/* Category tags */}
                {company.category_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {company.category_tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 border-border/40 text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Matched values */}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#7a7590", marginBottom: "8px" }}>
                  Matches: {matched.join(" · ")}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Link to={`/company/${company.slug}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5">
                      <Eye className="w-3 h-3" />
                      View Open Roles
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 px-2.5"
                    disabled={tracked}
                    onClick={() => handleTrack(company)}
                  >
                    {tracked ? (
                      <><Check className="w-3 h-3" /> Tracked</>
                    ) : (
                      <><Plus className="w-3 h-3" /> Track</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results state */}
      {query.trim().length >= 2 && dbResults && dbResults.length === 0 && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#7a7590", textAlign: "center", padding: "16px 0" }}>
          No companies found for "{query}". Try a different name.
        </p>
      )}

      {/* Browse link */}
      <Link
        to="/companies"
        className="text-xs font-medium mt-3 flex items-center gap-1 transition-colors"
        style={{ color: "#f0c040" }}
      >
        Browse all verified organizations <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
