import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, User, ChevronDown, ChevronUp, ExternalLink,
  Network, Shield, Briefcase, UserX, ShieldCheck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/sampleData";
import { FollowLeaderButton } from "@/components/FollowLeaderButton";
import { LeadershipVerifiedBadge } from "@/components/LeadershipVerifiedBadge";
import { ReportLeadershipChange } from "@/components/ReportLeadershipChange";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const CSUITE_TITLES = /\b(CEO|COO|CFO|CTO|CIO|CISO|CHRO|CLO|CPO|CRO|CMO|CDO|CSO|CCO|CAO|CHIEF|PRESIDENT|CHAIRMAN|CHAIRWOMAN|CHAIR|FOUNDER|CO-?FOUNDER)\b/i;

interface Executive {
  id: string;
  name: string;
  title: string;
  total_donations: number;
  photo_url?: string | null;
  source?: string | null;
  last_verified_at?: string | null;
  verification_status?: string | null;
}

interface BoardMember {
  id: string;
  name: string;
  title: string;
  photo_url?: string | null;
  start_year?: number | null;
  previous_company?: string | null;
  committees?: string[];
  is_independent?: boolean;
  source?: string | null;
  last_verified_at?: string | null;
  verification_status?: string | null;
}

interface DecisionMakersProps {
  executives: Executive[];
  companyId?: string;
  companyName: string;
  onExecutiveClick: (exec: Executive) => void;
}

function LeaderCard({
  name,
  title,
  photoUrl,
  badges,
  donations,
  startYear,
  previousCompany,
  committees,
  leaderId,
  leaderType,
  companyId,
  verificationStatus,
  onViewProfile,
  onTraceInfluence,
}: {
  name: string;
  title: string;
  photoUrl?: string | null;
  badges?: string[];
  donations?: number;
  startYear?: number | null;
  previousCompany?: string | null;
  committees?: string[];
  leaderId: string;
  leaderType: "executive" | "board_member";
  companyId?: string;
  verificationStatus?: string | null;
  onViewProfile: () => void;
  onTraceInfluence?: () => void;
}) {
  const isFormer = verificationStatus === "former";
  
  return (
    <Card className={cn("hover:border-primary/30 transition-all group", isFormer && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border/60 shrink-0"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border-2 border-border/60">
              <User className="w-5 h-5 text-muted-foreground/70" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-foreground">{name}</h4>
                <p className="text-xs text-muted-foreground">{title}</p>
              </div>
              <FollowLeaderButton
                leaderType={leaderType}
                leaderId={leaderId}
                leaderName={name}
                companyId={companyId}
                size="sm"
              />
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {isFormer && (
                <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
                  <UserX className="w-2.5 h-2.5" /> Former
                </Badge>
              )}
              {verificationStatus === "verified" && (
                <Badge variant="outline" className="text-[10px] gap-1 text-[hsl(var(--civic-green))] border-[hsl(var(--civic-green))]/30">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </Badge>
              )}
              {verificationStatus === "ai_verified" && (
                <Badge variant="outline" className="text-[10px] gap-1 text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30">
                  <AlertTriangle className="w-2.5 h-2.5" /> AI Verified
                </Badge>
              )}
              {startYear && (
                <Badge variant="outline" className="text-[10px]">Since {startYear}</Badge>
              )}
              {previousCompany && (
                <Badge variant="secondary" className="text-[10px]">Prev: {previousCompany}</Badge>
              )}
              {donations !== undefined && donations > 0 && (
                <Badge variant="outline" className="text-[10px] text-[hsl(var(--civic-yellow))] border-[hsl(var(--civic-yellow))]/30">
                  {formatCurrency(donations)} donated
                </Badge>
              )}
              {badges?.map((b) => (
                <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>
              ))}
            </div>

            {/* Committees for board members */}
            {committees && committees.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {committees.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px] gap-1">
                    <Shield className="w-2.5 h-2.5" /> {c}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link to={`/leader/${leaderId}`}><User className="w-3 h-3" /> View Profile</Link>
              </Button>
              {onTraceInfluence && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onTraceInfluence}>
                  <Network className="w-3 h-3" /> Trace Influence
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DecisionMakers({ executives, companyId, companyName, onExecutiveClick }: DecisionMakersProps) {
  const [showAll, setShowAll] = useState(false);

  // Fetch board members
  const { data: boardMembers } = useQuery({
    queryKey: ["board-members", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("board_members")
        .select("*")
        .eq("company_id", companyId!)
        .order("name");
      return (data || []) as BoardMember[];
    },
    enabled: !!companyId,
  });

  // Filter out former leaders by default, show current ones
  const activeExecs = executives.filter(e => e.verification_status !== "former");
  const formerExecs = executives.filter(e => e.verification_status === "former");
  const activeBoard = boardMembers?.filter(b => b.verification_status !== "former") || [];
  const formerBoard = boardMembers?.filter(b => b.verification_status === "former") || [];
  
  // Split executives into C-suite and others
  const cSuite = activeExecs.filter((e) => CSUITE_TITLES.test(e.title || ""));
  const others = activeExecs.filter((e) => !CSUITE_TITLES.test(e.title || ""));
  const displayedCSuite = cSuite;
  const displayedOthers = showAll ? [...others, ...formerExecs] : [];

  const totalLeaders = activeExecs.length + activeBoard.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Decision Makers
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalLeaders} identified
          </Badge>
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Key leaders who control company strategy, influence policy, and shape workforce decisions.
          </p>
          <LeadershipVerifiedBadge
            lastVerifiedAt={executives[0]?.last_verified_at}
            source={executives[0]?.source}
            compact
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="executive" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="executive" className="flex-1 gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Executive Team
              {cSuite.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{cSuite.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="board" className="flex-1 gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Board of Directors
              {(boardMembers?.length || 0) > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{boardMembers?.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="space-y-3">
            {displayedCSuite.length > 0 ? (
              <>
                {displayedCSuite.map((exec) => (
                  <LeaderCard
                    key={exec.id}
                    name={exec.name}
                    title={exec.title}
                    photoUrl={exec.photo_url}
                    donations={exec.total_donations}
                    leaderId={exec.id}
                    leaderType="executive"
                    companyId={companyId}
                    verificationStatus={exec.verification_status}
                    onViewProfile={() => onExecutiveClick(exec)}
                    onTraceInfluence={() => onExecutiveClick(exec)}
                  />
                ))}

                {/* Expanded others */}
                {displayedOthers.map((exec) => (
                  <LeaderCard
                    key={exec.id}
                    name={exec.name}
                    title={exec.title}
                    photoUrl={exec.photo_url}
                    donations={exec.total_donations}
                    leaderId={exec.id}
                    leaderType="executive"
                    companyId={companyId}
                    onViewProfile={() => onExecutiveClick(exec)}
                    onTraceInfluence={() => onExecutiveClick(exec)}
                  />
                ))}

                {others.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-xs gap-1.5 text-muted-foreground"
                  >
                    {showAll ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Hide Additional Leadership</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> View Full Leadership ({others.length} more)</>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No executive data available yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Run a company scan to discover leadership.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="board" className="space-y-3">
            {boardMembers && boardMembers.length > 0 ? (
              boardMembers.map((member) => (
                <LeaderCard
                  key={member.id}
                  name={member.name}
                  title={member.title}
                  photoUrl={member.photo_url}
                  startYear={member.start_year}
                  previousCompany={member.previous_company}
                  committees={member.committees}
                  badges={member.is_independent ? ["Independent"] : []}
                  leaderId={member.id}
                  leaderType="board_member"
                  companyId={companyId}
                  onViewProfile={() => {
                    // For now, opens as executive-like profile
                    onExecutiveClick({
                      id: member.id,
                      name: member.name,
                      title: member.title,
                      total_donations: 0,
                      photo_url: member.photo_url,
                    });
                  }}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No board data available yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Board data is sourced from SEC proxy statements (DEF 14A).</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Report leadership change + freshness */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <ReportLeadershipChange
            companyId={companyId || ""}
            companyName={companyName}
          />
          <LeadershipVerifiedBadge
            lastVerifiedAt={executives[0]?.last_verified_at || boardMembers?.[0]?.last_verified_at}
            source={executives[0]?.source || boardMembers?.[0]?.source}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
