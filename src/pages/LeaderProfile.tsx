import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User, ArrowLeft, Briefcase, Building2, Shield, DollarSign,
  ExternalLink, Linkedin, Globe, Search, Network, Calendar,
  Sparkles, Loader2, ChevronDown, ChevronUp, MapPin, Scale, UserX, ShieldCheck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { FollowLeaderButton } from "@/components/FollowLeaderButton";
import { LoadingState } from "@/components/LoadingState";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useLeaderEnrichment } from "@/hooks/use-leader-enrichment";
import { useState } from "react";

export default function LeaderProfile() {
  const { id } = useParams();
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [recipientSummaries, setRecipientSummaries] = useState<Record<string, string>>({});
  const [loadingRecipient, setLoadingRecipient] = useState<string | null>(null);

  // Try executive first
  const { data: executive, isLoading: execLoading } = useQuery({
    queryKey: ["leader-exec", id],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Try board member if not an exec
  const { data: boardMember, isLoading: boardLoading } = useQuery({
    queryKey: ["leader-board", id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("board_members").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id && !executive,
  });

  const leader = executive || boardMember;
  const leaderType = executive ? "executive" : "board_member";
  const companyId = leader?.company_id;

  // Fetch company name
  const { data: company } = useQuery({
    queryKey: ["leader-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, slug, industry").eq("id", companyId!).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch donation recipients for executives
  const { data: recipients } = useQuery({
    queryKey: ["leader-recipients", id],
    queryFn: async () => {
      const { data } = await supabase.from("executive_recipients").select("*").eq("executive_id", id!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!id && !!executive,
  });

  // Fetch entity linkages involving this person
  const { data: linkages } = useQuery({
    queryKey: ["leader-linkages", leader?.name, companyId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_linkages").select("*").eq("company_id", companyId!).or(`source_entity_name.ilike.%${leader!.name}%,target_entity_name.ilike.%${leader!.name}%`).limit(50);
      return data || [];
    },
    enabled: !!leader?.name && !!companyId,
  });

  // Fetch other board seats (board members at other companies)
  const { data: otherBoardSeats } = useQuery({
    queryKey: ["leader-other-boards", leader?.name],
    queryFn: async () => {
      const { data } = await (supabase as any).from("board_members").select("id, company_id, title, committees, start_year").ilike("name", `%${leader!.name}%`).neq("company_id", companyId!).limit(20);
      return data || [];
    },
    enabled: !!leader?.name && !!companyId,
  });

  // Fetch company names for other board seats
  const { data: otherCompanies } = useQuery({
    queryKey: ["leader-other-companies", otherBoardSeats?.map((b: any) => b.company_id)],
    queryFn: async () => {
      const ids = otherBoardSeats!.map((b: any) => b.company_id);
      const { data } = await supabase.from("companies").select("id, name, slug").in("id", ids);
      return data || [];
    },
    enabled: !!otherBoardSeats && otherBoardSeats.length > 0,
  });

  const { enrichment, isEnriching, enrich } = useLeaderEnrichment(leader?.id, leaderType);

  usePageSEO({
    title: leader ? `${leader.name} — Leader Profile` : "Leader Profile",
    description: leader ? `Intelligence profile for ${leader.name}${company ? ` at ${company.name}` : ""}` : "Leader profile",
  });

  const fetchRecipientImpact = async (recipientName: string, party: string) => {
    if (recipientSummaries[recipientName]) {
      setExpandedRecipient(expandedRecipient === recipientName ? null : recipientName);
      return;
    }
    setExpandedRecipient(recipientName);
    setLoadingRecipient(recipientName);
    try {
      const { data, error } = await supabase.functions.invoke("candidate-voting-summary", {
        body: { candidate_name: recipientName, party, state: "", district: null },
      });
      if (error) throw error;
      setRecipientSummaries(prev => ({ ...prev, [recipientName]: data?.summary || "No voting record data available." }));
    } catch {
      setRecipientSummaries(prev => ({ ...prev, [recipientName]: "Could not load voting record." }));
    } finally {
      setLoadingRecipient(null);
    }
  };

  if (execLoading || boardLoading) return <LoadingState message="Loading leader profile..." />;
  if (!leader) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Leader Not Found</h1>
        <p className="text-muted-foreground mb-6">This profile doesn't exist or has been removed.</p>
        <Button variant="outline" asChild><Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link></Button>
      </div>
    );
  }

  const displayName = leader.name;
  const displayCompanyName = enrichment?.normalized_company_name || company?.name || "";
  const cleanCompany = displayCompanyName.replace(/,?\s*(LP|LLC|Inc\.?|Corp\.?|Co\.?)$/i, "").trim();
  const linkedInUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(displayName + " " + cleanCompany)}`;
  const fecUrl = `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(displayName)}&contributor_employer=${encodeURIComponent(company?.name || "")}`;
  const openSecretsUrl = `https://www.opensecrets.org/search?q=${encodeURIComponent(displayName)}&type=donors`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {company && (
          <Link to={`/company/${company.slug}`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {company.name}
          </Link>
        )}
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </div>

      {/* Hero */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {leader.photo_url ? (
              <img src={leader.photo_url} alt={displayName} className="w-20 h-20 rounded-full object-cover border-2 border-border/60 shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-border/60">
                <User className="w-8 h-8 text-muted-foreground/70" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                  <p className="text-base text-muted-foreground">{leader.title}{displayCompanyName ? ` at ${displayCompanyName}` : ""}</p>
                </div>
                <FollowLeaderButton leaderType={leaderType} leaderId={leader.id} leaderName={displayName} companyId={companyId} />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="gap-1"><Briefcase className="w-3 h-3" /> {leaderType === "executive" ? "Executive" : "Board Member"}</Badge>
                {leader.verification_status === "former" && (
                  <Badge variant="outline" className="gap-1 text-destructive border-destructive/30"><UserX className="w-3 h-3" /> Former</Badge>
                )}
                {leader.verification_status === "verified" && (
                  <Badge variant="outline" className="gap-1 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"><ShieldCheck className="w-3 h-3" /> Verified Current</Badge>
                )}
                {leader.verification_status === "ai_verified" && (
                  <Badge variant="outline" className="gap-1 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"><AlertTriangle className="w-3 h-3" /> AI Verified</Badge>
                )}
                {(boardMember as any)?.is_independent && <Badge variant="secondary" className="gap-1"><Shield className="w-3 h-3" /> Independent</Badge>}
                {(boardMember as any)?.start_year && <Badge variant="outline" className="gap-1"><Calendar className="w-3 h-3" /> Since {(boardMember as any).start_year}</Badge>}
                {executive?.total_donations > 0 && <Badge variant="outline" className="gap-1 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"><DollarSign className="w-3 h-3" /> {formatCurrency(executive.total_donations)} donated</Badge>}
              </div>

              {(enrichment?.bio || (boardMember as any)?.bio) && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{enrichment?.bio || (boardMember as any).bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Intelligence Brief */}
      {enrichment?.ai_narrative ? (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Intelligence Brief
              <Badge variant="outline" className="text-[10px] ml-auto font-mono">
                {enrichment.enrichment_source === "firecrawl+ai" ? "WEB + AI" : "AI GENERATED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichment.education && enrichment.education !== "Not publicly available" && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">EDUCATION</Badge>
                <span className="text-sm text-muted-foreground">{enrichment.education}</span>
              </div>
            )}
            {enrichment.career_highlights && enrichment.career_highlights.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Key Milestones</span>
                <ul className="space-y-1">
                  {enrichment.career_highlights.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Separator />
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{enrichment.ai_narrative}</div>
            <p className="text-[10px] text-muted-foreground/60 italic">
              Generated {new Date(enrichment.enriched_at).toLocaleDateString()} · Source: {enrichment.enrichment_source}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">AI Intelligence Brief Available</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Generate a complete dossier with normalized company data, bio, career highlights, and narrative analysis.
            </p>
            <Button
              onClick={() => enrich({
                leader_name: leader.name,
                leader_title: leader.title,
                company_id: companyId,
                company_name: company?.name,
                company_industry: company?.industry,
              })}
              disabled={isEnriching}
              size="sm"
              className="gap-2"
            >
              {isEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isEnriching ? "Generating Dossier..." : "Generate Intelligence Brief"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Board Committees */}
          {(boardMember as any)?.committees?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Board Committees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(boardMember as any).committees.map((c: string) => (
                  <div key={c} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/40">
                    <Shield className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-sm font-medium text-foreground">{c}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Political Donations */}
          {recipients && recipients.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Political Donations</CardTitle>
                <p className="text-xs text-muted-foreground">Personal contributions — click a recipient to see their voting record.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {recipients.map((r: any, idx: number) => {
                  const isExpanded = expandedRecipient === r.name;
                  const summary = recipientSummaries[r.name];
                  return (
                    <div key={r.id} className="rounded-lg border border-border overflow-hidden">
                      <button onClick={() => fetchRecipientImpact(r.name, r.party)} className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-primary/5 transition-colors text-left">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">#{idx + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-sm text-foreground">{r.name}</span>
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", r.party === "Republican" && "border-destructive/50 text-destructive", r.party === "Democrat" && "border-primary/50 text-primary")}>{r.party === "Republican" ? "R" : r.party === "Democrat" ? "D" : r.party}</Badge>
                              {r.state && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{r.state}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-foreground">{formatCurrency(r.amount)}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 border-t border-border bg-card">
                          {loadingRecipient === r.name ? (
                            <div className="flex items-center gap-2 py-3"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Researching...</span></div>
                          ) : summary ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-foreground uppercase tracking-wide">What this money supports</span></div>
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{summary}</p>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Influence Connections */}
          {linkages && linkages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Network className="w-4 h-4 text-primary" /> Influence Connections</CardTitle>
                <p className="text-xs text-muted-foreground">Known connections in the intelligence chain.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkages.slice(0, 15).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{l.source_entity_name}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm font-medium text-foreground">{l.target_entity_name}</span>
                      </div>
                      {l.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{l.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{l.link_type?.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other Board Seats */}
          {otherBoardSeats && otherBoardSeats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Other Board Seats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {otherBoardSeats.map((seat: any) => {
                  const co = otherCompanies?.find((c: any) => c.id === seat.company_id);
                  return (
                    <div key={seat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <div>
                        <span className="text-sm font-medium text-foreground">{co?.name || "Unknown Company"}</span>
                        <p className="text-xs text-muted-foreground">{seat.title}{seat.start_year ? ` · Since ${seat.start_year}` : ""}</p>
                      </div>
                      {co?.slug && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link to={`/company/${co.slug}`}>View Company</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Jackye's Take */}
          <Card className="bg-primary/[0.03] border-primary/15">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {executive
                  ? `${displayName} holds a ${leader.title} position${displayCompanyName ? ` at ${displayCompanyName}` : ""}. ${executive.total_donations > 0 ? `They have ${formatCurrency(executive.total_donations)} in tracked political donations. Understand where this money goes to see what policies this leader financially supports.` : "No tracked political donations were found, but that doesn't mean no influence exists — check trade association and lobbying connections."}`
                  : `${displayName} serves on the board${displayCompanyName ? ` of ${displayCompanyName}` : ""}. Board members shape company strategy through governance oversight, committee assignments, and executive compensation decisions. ${(boardMember as any)?.is_independent ? "This director is classified as independent." : "Check whether this director has ties that could compromise independence."}`
                }
              </p>
            </CardContent>
          </Card>

          {/* External References */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Research Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
                <a href={fecUrl} target="_blank" rel="noopener noreferrer"><Scale className="w-3.5 h-3.5" /> FEC Contributions</a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
                <a href={openSecretsUrl} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5" /> OpenSecrets</a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" asChild>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(`"${displayName}" "${cleanCompany}" SEC filing`)}`} target="_blank" rel="noopener noreferrer"><Search className="w-3.5 h-3.5" /> SEC Filings</a>
              </Button>
            </CardContent>
          </Card>

          {/* Company context */}
          {company && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Company</p>
                <Link to={`/company/${company.slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> {company.name}
                </Link>
                {company.industry && <p className="text-xs text-muted-foreground mt-1">{company.industry}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
