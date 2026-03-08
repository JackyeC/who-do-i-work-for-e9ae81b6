import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ClipboardCheck, Users, Search, ArrowRight } from "lucide-react";

export default function Check() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "company";
  const [companyQuery, setCompanyQuery] = useState("");

  const handleCompanySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyQuery.trim()) navigate(`/search?q=${encodeURIComponent(companyQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground font-display mb-2">Check</h1>
          <p className="text-muted-foreground">Investigate companies, offers, and political funding.</p>
        </div>

        <Tabs defaultValue={initialTab} className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="company" className="gap-1.5">
              <Building2 className="w-4 h-4" /> Company Check
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-1.5">
              <ClipboardCheck className="w-4 h-4" /> Offer Check
            </TabsTrigger>
            <TabsTrigger value="candidate" className="gap-1.5">
              <Users className="w-4 h-4" /> Who Funds This Candidate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-luxury">
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">Company Check</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Search any company to view signals including hiring technology, worker benefits, political influence, worker sentiment, and organizational affiliations.
              </p>
              <form onSubmit={handleCompanySearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={companyQuery}
                    onChange={(e) => setCompanyQuery(e.target.value)}
                    placeholder="Enter company name..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  Check <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
              <div className="mt-6">
                <Button variant="link" className="text-sm p-0 h-auto text-muted-foreground" onClick={() => navigate("/browse")}>
                  Or browse all companies →
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="offer">
            <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-luxury">
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">Offer Check</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Search a company to run an Offer Check report — analyze salary structure, equity terms, contract language, and company intelligence context.
              </p>
              <form onSubmit={handleCompanySearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={companyQuery}
                    onChange={(e) => setCompanyQuery(e.target.value)}
                    placeholder="Enter company name..."
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  Search <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="candidate">
            <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-luxury">
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">Who Funds This Candidate?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Reverse influence lookup — see a candidate's funding sources, company-linked donors, PAC donors, and industry clusters.
              </p>
              <Button onClick={() => navigate("/voter-lookup")} className="gap-2">
                Look Up a Candidate <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
