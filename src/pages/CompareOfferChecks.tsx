import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, ClipboardCheck, Loader2, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PremiumGate } from "@/components/PremiumGate";
import { useAuth } from "@/contexts/AuthContext";
import { useOfferCheck } from "@/hooks/use-offer-check";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function CompanyColumn({ companyId, onRemove }: { companyId: string; onRemove: () => void }) {
  const { company, sections, totalSignals, staleSections, tiCategories } = useOfferCheck(companyId);

  if (!company) {
    return (
      <Card className="flex-1 min-w-[280px]">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const transparencyCount = tiCategories.filter(c => c.hasSignals).length;

  return (
    <Card className="flex-1 min-w-[280px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {company.name}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{company.industry} · {company.state}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{totalSignals}</div>
            <div className="text-[10px] text-muted-foreground">Signals</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{transparencyCount}/7</div>
            <div className="text-[10px] text-muted-foreground">Disclosures</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{staleSections}</div>
            <div className="text-[10px] text-muted-foreground">Stale</div>
          </div>
        </div>

        {/* Section breakdown */}
        {sections.map((section) => (
          <div key={section.id} className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{section.title}</span>
              {section.stale && (
                <Badge variant="outline" className="text-[9px] text-muted-foreground">Stale</Badge>
              )}
            </div>
            {section.hasData ? (
              <div className="space-y-1">
                <Badge variant="secondary" className="text-[10px]">
                  {section.signals.length} signal{section.signals.length !== 1 ? "s" : ""}
                </Badge>
                {section.signals.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                ))}
                {section.signals.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{section.signals.length - 3} more</p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No signals detected.</p>
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(`/offer-check/${companyId}`, "_blank")}>
          View Full Report
        </Button>
      </CardContent>
    </Card>
  );
}

function CompanySearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");

  const { data: results } = useQuery({
    queryKey: ["compare-search", query],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, industry, state, slug")
        .ilike("name", `%${query}%`)
        .limit(5);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company..."
          className="pl-8 h-9 text-sm"
        />
      </div>
      {results && results.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); setQuery(""); }}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
            >
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{c.industry} · {c.state}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompareOfferChecks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addCompany = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeCompany = (id: string) => {
    setSelectedIds(selectedIds.filter(x => x !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Compare Offer Checks</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare public signals across companies side by side.
          </p>
        </motion.div>

        <PremiumGate
          feature="Company Comparison"
          description="Compare Offer Checks across multiple companies side by side. Upgrade to premium to unlock this feature."
        >
          <div className="mb-6">
            <CompanySearch onSelect={addCompany} />
          </div>

          {selectedIds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Search and add up to 4 companies to compare.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {selectedIds.map((id) => (
                <CompanyColumn key={id} companyId={id} onRemove={() => removeCompany(id)} />
              ))}
              {selectedIds.length < 4 && (
                <Card className="flex-1 min-w-[280px] border-dashed">
                  <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="text-center">
                      <Plus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Add another company</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </PremiumGate>
      </div>
      <Footer />
    </div>
  );
}
