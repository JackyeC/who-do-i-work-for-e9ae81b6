import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Building2, ArrowRight, TrendingUp, Shield, Network, DollarSign, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/data/sampleData";

const FEATURED_SLUGS = [
  "amazon",
  "exxonmobil",
  "meta",
  "pfizer",
  "jpmorgan-chase",
  "google",
  "walmart",
  "lockheed-martin",
  "comcast",
  "koch-industries",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06 },
  }),
};

export default function Examples() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: companies } = useQuery({
    queryKey: ["example-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("slug, name, industry, state, employer_clarity_score, total_pac_spending, lobbying_spend, logo_url")
        .in("slug", FEATURED_SLUGS)
        .order("total_pac_spending", { ascending: false });
      return data || [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
<section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-gold-light/30 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 pt-20 pb-12 relative">
          <motion.div initial="hidden" animate="show" className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 border-civic-gold-muted/40 text-civic-gold text-xs font-semibold tracking-wide px-4 py-1.5">
                Example Profiles
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-display">
              Influence Profiles You Can Explore Now
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Browse pre-analyzed company profiles to see political spending, lobbying activity, influence networks, and values signals in action.
            </motion.p>
            <motion.form variants={fadeUp} custom={3} onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Or search any company..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!query.trim()}>
                  <Search className="w-4 h-4 mr-1.5" />
                  Search
                </Button>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {companies && companies.length > 0 ? (
            companies.map((c, i) => (
              <motion.div
                key={c.slug}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={i}
              >
                <Card
                  className="group cursor-pointer hover:shadow-elegant hover:border-civic-gold-muted/30 transition-all duration-300 h-full"
                  onClick={() => navigate(`/dossier/${c.slug}`)}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-lg object-contain border border-border/60" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{c.industry} · {c.state}</p>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {(c.total_pac_spending ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="w-3.5 h-3.5 text-primary/60" />
                          <span>PAC Spending: {formatCurrency(c.total_pac_spending ?? 0)}</span>
                        </div>
                      )}
                      {(c.lobbying_spend ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Landmark className="w-3.5 h-3.5 text-primary/60" />
                          <span>Lobbying: {formatCurrency(c.lobbying_spend ?? 0)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
                        <span>Employer Clarity Score: {c.employer_clarity_score}/100</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/30">
                      <span className="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
                        View Full Profile <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No example profiles available yet. Use the search above to find any company.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-xl font-bold text-foreground mb-3 font-display">Don't See Your Company?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Search any company to generate an influence profile. Our system checks FEC filings, lobbying disclosures, government contracts, and more.
          </p>
          <Button onClick={() => navigate("/check?tab=company")} size="lg" className="gap-2">
            <Search className="w-4 h-4" />
            Check Any Company
          </Button>
        </div>
      </section>
</div>
  );
}
