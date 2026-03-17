import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/ConfidenceBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/data/sampleData";
import {
  MapPin, Search, Loader2, User, DollarSign, AlertTriangle,
  Building2, ExternalLink, Flag, Shield, Clock, Database, Globe
} from "lucide-react";

interface RepData {
  name: string;
  title: string;
  party: string;
  state: string;
  level: string;
  district?: string;
  inOurDatabase: boolean;
  notableInfo?: string;
  corporateFunders: Array<{
    companyName: string;
    companySlug: string;
    companyScore: number;
    industry: string;
    amount: number;
    donationType: string;
    flagged: boolean;
    flagReason?: string;
    source?: string;
  }>;
  totalCorporateFunding: number;
  flaggedDonations: any[];
  fecDataFound?: boolean;
  photoUrl?: string | null;
  chamber?: string | null;
  committees?: string[];
  termsServed?: number | null;
  officialParty?: string | null;
  dataSources?: string[];
  confidence?: string;
  confidenceScore?: number;
  lastUpdated?: string;
}

interface LookupResult {
  state: string;
  district: string;
  representatives: RepData[];
  stateLevel: any[];
  searchedAddress: string;
}

const partyColors: Record<string, string> = {
  D: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  R: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  I: "bg-muted text-muted-foreground",
};

const sourceIcons: Record<string, { label: string; icon: typeof Shield }> = {
  "congress.gov": { label: "Congress.gov", icon: Shield },
  fec: { label: "FEC", icon: Database },
  database: { label: "CivicLens DB", icon: Database },
  ai: { label: "AI Inference", icon: Globe },
};

function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((s) => {
        const meta = sourceIcons[s] || { label: s, icon: Globe };
        return (
          <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0 gap-1 border-border text-muted-foreground">
            <meta.icon className="w-2.5 h-2.5" />
            {meta.label}
          </Badge>
        );
      })}
    </div>
  );
}

function RepCard({ rep }: { rep: RepData }) {
  const partyLabel = rep.officialParty || (rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Photo or icon */}
            {rep.photoUrl ? (
              <img
                src={rep.photoUrl}
                alt={rep.name}
                className="w-12 h-12 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Link
                  to={`/representative/${encodeURIComponent(rep.name)}`}
                  className="hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  {rep.name}
                </Link>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {rep.title}
                {rep.chamber ? ` · ${rep.chamber}` : ""}
                {rep.termsServed ? ` · ${rep.termsServed} term${rep.termsServed !== 1 ? "s" : ""}` : ""}
              </p>
              {rep.notableInfo && <p className="text-xs text-muted-foreground/70 mt-1">{rep.notableInfo}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className={partyColors[rep.party] || partyColors.I}>
              {partyLabel}
            </Badge>
            {rep.flaggedDonations?.length > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {rep.flaggedDonations.length} flagged
              </Badge>
            )}
          </div>
        </div>

        {/* Committees */}
        {rep.committees && rep.committees.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {rep.committees.slice(0, 4).map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px] font-normal">
                {c}
              </Badge>
            ))}
            {rep.committees.length > 4 && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                +{rep.committees.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Source + confidence row */}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {rep.confidence && (
              <ConfidenceBadge level={rep.confidence as ConfidenceLevel} />
            )}
            {rep.dataSources && <SourceBadges sources={rep.dataSources} />}
          </div>
          {rep.lastUpdated && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <Clock className="w-2.5 h-2.5" />
              {new Date(rep.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rep.corporateFunders && rep.corporateFunders.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total corporate donations
              </span>
              <span className="font-bold text-foreground text-lg">{formatCurrency(rep.totalCorporateFunding)}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Funders</h4>
              {rep.corporateFunders.map((funder, j) => {
                const hasProfile = funder.companySlug;
                const Wrapper = hasProfile ? Link : "div";
                const wrapperProps = hasProfile
                  ? { to: `/company/${funder.companySlug}`, className: "flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group" }
                  : { className: "flex items-center justify-between p-3 rounded-lg border border-border" };
                return (
                  <Wrapper key={j} {...(wrapperProps as any)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${hasProfile ? "text-foreground group-hover:text-primary transition-colors" : "text-foreground"}`}>{funder.companyName}</span>
                          {hasProfile && <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {funder.industry && <><span>{funder.industry}</span><span>·</span></>}
                          {funder.companyScore != null && <><span>Score: {funder.companyScore}/100</span><span>·</span></>}
                          <span className="capitalize">{(funder.donationType || "pac").replace(/[-_]/g, " ")}</span>
                          {funder.source === "fec" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1 border-primary/20 text-primary/70">FEC</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-foreground">{formatCurrency(funder.amount)}</span>
                      {funder.flagged && (
                        <div className="flex items-center gap-1 text-xs text-destructive mt-0.5">
                          <Flag className="w-3 h-3" />
                          {funder.flagReason || "Flagged"}
                        </div>
                      )}
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-border/50">
            <Database className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-medium">Limited public data available</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              {rep.fecDataFound === false
                ? "FEC records were searched — no corporate PAC donations found for current cycle."
                : "We're continuously expanding our data coverage."}
            </p>
            <p className="text-[10px] mt-2 text-muted-foreground/50">
              Check <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">FEC.gov</a> for the latest filings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VoterLookup() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsSearching(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("voter-lookup", {
        body: { address: address.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        setResult(data.data);
        if (data.data.representatives.length === 0) {
          toast({ title: "No results", description: "Couldn't find representatives for that address. Try a more specific address.", variant: "destructive" });
        }
      } else {
        throw new Error(data?.error || "Lookup failed");
      }
    } catch (e: any) {
      toast({ title: "Lookup failed", description: e.message || "Could not complete voter lookup.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  // Group reps by level
  const federalReps = result?.representatives?.filter(r => r.level === "federal" || !r.level) || [];
  const stateReps = result?.stateLevel || [];

  return (
    <div className="flex flex-col bg-background min-h-0 flex-1">
      <div className="container mx-auto px-4 py-8 flex-1">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">
              Who Represents Me in DC?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Enter your address to see your elected representatives — and which corporations are funding their campaigns.
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-10">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              placeholder="Enter your street address, city, state (e.g. 1600 Pennsylvania Ave, Washington, DC)"
            />
            <Button type="submit" disabled={isSearching || !address.trim()} className="gap-1.5 shrink-0">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? "Looking up..." : "Find My Reps"}
            </Button>
          </form>

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Results for: <strong className="text-foreground">{result.searchedAddress}</strong></span>
                {result.state && <Badge variant="secondary">{result.state}{result.district ? ` — District ${result.district}` : ""}</Badge>}
              </div>

              {federalReps.length === 0 && stateReps.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No representatives found. Try a more specific US address.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Federal */}
                  {federalReps.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Federal Representatives
                      </h2>
                      {federalReps.map((rep, i) => (
                        <RepCard key={i} rep={rep} />
                      ))}
                    </div>
                  )}

                  {/* State */}
                  {stateReps.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        State-Level Representatives
                      </h2>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            {stateReps.map((rep: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-md border border-border">
                                <div>
                                  <span className="font-medium text-sm text-foreground">{rep.name}</span>
                                  <p className="text-xs text-muted-foreground">{rep.title} {rep.district ? `— ${rep.district}` : ""}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {rep.confidence && (
                                    <ConfidenceBadge level={rep.confidence as ConfidenceLevel} />
                                  )}
                                  <Badge variant="outline" className={partyColors[rep.party] || partyColors.I}>
                                    {rep.party}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              )}

              {/* Data note */}
              <p className="text-center text-[10px] text-muted-foreground/50 font-mono mt-6">
                Data sourced from FEC filings, Congress.gov, and public records · Last searched {new Date().toLocaleDateString()}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
