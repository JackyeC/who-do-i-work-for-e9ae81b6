import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ClipboardCheck, Users, Search, ArrowRight, ShieldCheck, Upload } from "lucide-react";

export default function Check() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "company";
  const [companyQuery, setCompanyQuery] = useState("");

  const handleCompanySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyQuery.trim()) navigate(`/search?q=${encodeURIComponent(companyQuery.trim())}`);
  };

  const handleOfferSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyQuery.trim()) navigate(`/search?q=${encodeURIComponent(companyQuery.trim())}&intent=offer`);
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
              <Users className="w-4 h-4" /> What Am I Supporting?
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
                Three ways to check your offer — no PII required:
              </p>

              <div className="space-y-4">
                {/* Option 1: Quick manual input */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">Strategic Offer Review</h3>
                    <Badge className="text-[10px] bg-primary/10 text-primary border-0">Recommended</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Five-layer analysis: walk-away calculator, civic & legal audit, equity visualizer, negotiation scripts, and scam detection. No PII required.
                  </p>
                  <Button onClick={() => navigate("/strategic-offer-review")} className="gap-2">
                    <ClipboardCheck className="w-4 h-4" /> Start Strategic Review
                  </Button>
                </div>

                {/* Option 2: Upload offer letter */}
                <div className="p-4 rounded-xl border border-border/40">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground text-sm">Upload Offer Letter</h3>
                    <Badge variant="outline" className="text-[10px]">Private</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a PDF or DOCX for AI-powered term extraction. Your document is encrypted and visible only to you. Original files can be auto-deleted after analysis.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/offer-review-direct")} className="gap-2">
                    <Upload className="w-4 h-4" /> Upload Offer Letter
                  </Button>
                </div>

                {/* Option 3: Company search */}
                <div className="p-4 rounded-xl border border-border/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground text-sm">Research by Company</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Look up a company to see public signals about pay, hiring, worker conditions, and influence — before you accept.
                  </p>
                  <form onSubmit={handleOfferSearch} className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={companyQuery}
                        onChange={(e) => setCompanyQuery(e.target.value)}
                        placeholder="Enter company name..."
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" variant="outline" className="gap-2">
                      Research <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="candidate">
            <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-luxury">
              <h2 className="text-xl font-semibold text-foreground mb-2 font-display">What Am I Supporting?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Explore financial and influence relationships between companies, executives, PACs, and political recipients using publicly available data.
              </p>
              <Button onClick={() => navigate("/voter-lookup")} className="gap-2">
                Explore Relationships <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
