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
  Sparkles, Loader2, ChevronDown, ChevronUp, MapPin, Scale, UserX, ShieldCheck, AlertTriangle,
  GraduationCap, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { FollowLeaderButton } from "@/components/FollowLeaderButton";
import { LoadingState } from "@/components/LoadingState";
import { usePageSEO } from "@/hooks/use-page-seo";
import { useLeaderEnrichment } from "@/hooks/use-leader-enrichment";
import { VerifySignalButton } from "@/components/VerifySignalButton";
import { useState } from "react";

export default function LeaderProfile() {
  const { id } = useParams();
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [recipientSummaries, setRecipientSummaries] = useState<Record<string, string>>({});
  const [loadingRecipient, setLoadingRecipient] = useState<string | null>(null);

  const { data: executive, isLoading: execLoading } = useQuery({
    queryKey: ["leader-exec", id],
    queryFn: async () => {
      const { data } = await supabase.from("company_executives").select("*").eq("id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

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

  const { data: company } = useQuery({
    queryKey: ["leader-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, slug, industry").eq("id", companyId!).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: recipients } = useQuery({
    queryKey: ["leader-recipients", id],
    queryFn: async () => {
      const { data } = await supabase.from("executive_recipients").select("*").eq("executive_id", id!).order("amount", { ascending: false });
      return data || [];
    },
    enabled: !!id && !!executive,
  });

  const { data: linkages } = useQuery({
    queryKey: ["leader-linkages", leader?.name, companyId],
    queryFn: async () => {
      const { data } = await supabase.from("entity_linkages").select("*").eq("company_id", companyId!).or(`source_entity_name.ilike.%${leader!.name}%,target_entity_name.ilike.%${leader!.name}%`).limit(50);
      return data || [];
    },
    enabled: !!leader?.name && !!companyId,
  });

  const { data: otherBoardSeats } = useQuery({
    queryKey: ["leader-other-boards", leader?.name],
    queryFn: async () => {
      const { data } = await (supabase as any).from("board_members").select("id, company_id, title, committees, start_year").ilike("name", `%${leader!.name}%`).neq("company_id", companyId!).limit(20);
      return data || [];
    },
    enabled: !!leader?.name && !!companyId,
  });

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
  const photoUrl = enrichment?.photo_url || leader.photo_url;
  const linkedInUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(displayName + " " + cleanCompany)}`;
  const fecUrl = `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(displayName)}&contributor_employer=${encodeURIComponent(company?.name || "")}`;
  const openSecretsUrl = `https://www.opensecrets.org/search?q=${encodeURIComponent(displayName)}&type=donors`;

  const hasContent = (recipients && recipients.length > 0) || (linkages && linkages.length > 0) || (otherBoardSeats && otherBoardSeats.length > 0) || (boardMember as any)?.committees?.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {company && (
          <Link to={`/company/${company.slug}`} className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> {cleanCompany}
          </Link>
        )}
        <span>/</span>
        <span className="text-foreground font-medium">{displayName}</span>
      </div>

      {/* Hero Card - Full width, balanced layout */}
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left: Photo + Identity */}
            <div className="md:w-64 shrink-0 bg-muted/30 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-border/40">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-28 h-28 rounded-full object-cover border-3 border-primary/20 shadow-lg mb-4" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center mb-4 border-3 border-border/40">
                  <User className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
              <h1 className="text-xl font-bold text-foreground leading-tight">{displayName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{leader.title}</p>
              {displayCompanyName && (
                <p className="text-sm text-primary font-medium mt-1">{displayCompanyName}</p>
              )}
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Briefcase className="w-2.5 h-2.5" /> {leaderType === "executive" ? "Executive" : "Board"}
                </Badge>
                {leader.verification_status === "former" && (
                  <Badge variant="outline" className="gap-1 text-xs text-destructive border-destructive/30"><UserX className="w-2.5 h-2.5" /> Former</Badge>
                )}
                {leader.verification_status === "verified" && (
                  <Badge variant="outline" className="gap-1 text-xs text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30"><ShieldCheck className="w-2.5 h-2.5" /> Verified</Badge>
                )}
                {leader.verification_status === "ai_verified" && (
                  <Badge variant="outline" className="gap-1 text-xs text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30"><AlertTriangle className="w-2.5 h-2.5" /> AI Verified</Badge>
                )}
              </div>
              <div className="mt-4 w-full">
                <FollowLeaderButton leaderType={leaderType} leaderId={leader.id} leaderName={displayName} companyId={companyId} />
              </div>
            </div>

            {/* Right: Quick stats + Bio */}
            <div className="flex-1 p-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {executive?.total_donations > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <DollarSign className="w-4 h-4 text-[hsl(var(--civic-yellow))] mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{formatCurrency(executive.total_donations)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Donated</p>
                  </div>
                )}
                {recipients && recipients.length > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{recipients.length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Recipients</p>
                  </div>
                )}
                {(boardMember as any)?.is_independent && (
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <Shield className="w-4 h-4 text-[hsl(var(--civic-green))] mx-auto mb-1" />
                    <p className="text-sm font-bold text-foreground">Independent</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Director</p>
                  </div>
                )}
                {(boardMember as any)?.start_year && (
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{(boardMember as any).start_year}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Since</p>
                  </div>
                )}
                {linkages && linkages.length > 0 && (
                  <div className="bg-muted/40 rounded-lg p-3 text-center">
                    <Network className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{linkages.length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Connections</p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {(enrichment?.bio || (boardMember as any)?.bio) && (
                <div className="mb-4">
                  <p className="text-sm text-foreground leading-relaxed">{enrichment?.bio || (boardMember as any).bio}</p>
                </div>
              )}

              {/* Education */}
              {enrichment?.education && enrichment.education !== "Not publicly available" && (
                <div className="flex items-start gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{enrichment.education}</span>
                </div>
              )}

              {/* Quick links */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="w-3 h-3" /> LinkedIn</a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <a href={fecUrl} target="_blank" rel="noopener noreferrer"><Scale className="w-3 h-3" /> FEC</a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <a href={openSecretsUrl} target="_blank" rel="noopener noreferrer"><Globe className="w-3 h-3" /> OpenSecrets</a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(`"${displayName}" "${cleanCompany}" SEC filing`)}`} target="_blank" rel="noopener noreferrer"><Search className="w-3 h-3" /> SEC</a>
                </Button>
                <VerifySignalButton signalType="leader_profile" signalId={leader.id} companyId={companyId} compact />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intelligence Brief - Full width */}
      {enrichment?.ai_narrative ? (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Intelligence Brief
              <Badge variant="outline" className="text-xs ml-auto font-mono">
                {enrichment.enrichment_source === "firecrawl+ai" ? "WEB + AI" : "AI GENERATED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichment.career_highlights && enrichment.career_highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enrichment.career_highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/30">
                    <span className="text-primary font-bold text-sm mt-0.5">#{i + 1}</span>
                    <span className="text-sm text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">{enrichment.ai_narrative}</div>
            <p className="text-xs text-muted-foreground/60 italic">
              Generated {new Date(enrichment.enriched_at).toLocaleDateString()} · Source: {enrichment.enrichment_source}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary/30">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">AI Intelligence Brief Available</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              Generate a complete dossier with normalized company data, headshot search, bio, career highlights, and narrative analysis.
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

      {/* Two-column content grid - only show if there's content */}
      {hasContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Board Committees */}
          {(boardMember as any)?.committees?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Board Committees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(boardMember as any).committees.map((c: string) => (
                  <div key={c} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <Shield className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-sm font-medium text-foreground">{c}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Political Donations */}
          {recipients && recipients.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Political Donations</CardTitle>
                <p className="text-xs text-muted-foreground">Personal contributions — click to see voting record impact.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recipients.map((r: any, idx: number) => {
                    const isExpanded = expandedRecipient === r.name;
                    const summary = recipientSummaries[r.name];
                    return (
                      <div key={r.id} className={cn("rounded-lg border border-border overflow-hidden", isExpanded && "md:col-span-2")}>
                        <button onClick={() => fetchRecipientImpact(r.name, r.party)} className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-primary/5 transition-colors text-left">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">#{idx + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm text-foreground">{r.name}</span>
                                <Badge variant="outline" className={cn("text-xs px-1.5 py-0", r.party === "Republican" && "border-destructive/50 text-destructive", r.party === "Democrat" && "border-primary/50 text-primary")}>{r.party === "Republican" ? "R" : r.party === "Democrat" ? "D" : r.party}</Badge>
                                {r.state && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{r.state}</span>}
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Influence Connections */}
          {linkages && linkages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Network className="w-4 h-4 text-primary" /> Influence Connections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkages.slice(0, 10).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-foreground">{l.source_entity_name}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-xs font-medium text-foreground">{l.target_entity_name}</span>
                      </div>
                      {l.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{l.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{l.link_type?.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other Board Seats */}
          {otherBoardSeats && otherBoardSeats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Other Board Seats</CardTitle>
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
                          <Link to={`/company/${co.slug}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Jackye's Take - Full width at bottom */}
      <Card className="bg-primary/[0.03] border-primary/15">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Jackye's Take</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {executive
              ? `${displayName} holds a ${leader.title} position${displayCompanyName ? ` at ${displayCompanyName}` : ""}. ${executive.total_donations > 0 ? `They have ${formatCurrency(executive.total_donations)} in tracked political donations. Understand where this money goes to see what policies this leader financially supports.` : "No tracked political donations were found, but that doesn't mean no influence exists — check trade association and lobbying connections."}`
              : `${displayName} serves on the board${displayCompanyName ? ` of ${displayCompanyName}` : ""}. Board members shape company strategy through governance oversight, committee assignments, and executive compensation decisions. ${(boardMember as any)?.is_independent ? "This director is classified as independent." : "Check whether this director has ties that could compromise independence."}`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
