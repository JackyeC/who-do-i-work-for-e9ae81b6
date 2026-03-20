import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/use-user-role";
import { usePageSEO } from "@/hooks/use-page-seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── sample candidate data (swap for DB later) ─── */
const IMPACT_COMPETENCIES = [
  "Systems Thinking",
  "Stakeholder Fluency",
  "Resource Stewardship",
  "Narrative Advocacy",
  "Mission Durability",
] as const;

type Candidate = {
  id: string;
  initials: string;
  color: string;
  targetRoles: string[];
  topValues: string[];
  missionAlignmentScore: number;
  impactCompetencies: string[];
  workOrientation: number; // 0 = compensation, 1 = purpose
  experienceYears: number;
  location: string;
};

const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "c1",
    initials: "TW",
    color: "hsl(var(--primary))",
    targetRoles: ["Program Director", "Impact Lead"],
    topValues: ["Mission-driven work", "Autonomy", "Growth opportunities"],
    missionAlignmentScore: 91,
    impactCompetencies: ["Systems Thinking", "Stakeholder Fluency", "Mission Durability"],
    workOrientation: 0.82,
    experienceYears: 12,
    location: "Remote",
  },
  {
    id: "c2",
    initials: "RM",
    color: "hsl(160 50% 40%)",
    targetRoles: ["Senior Product Manager"],
    topValues: ["Work-life balance", "Innovation", "Team culture"],
    missionAlignmentScore: 78,
    impactCompetencies: ["Narrative Advocacy", "Resource Stewardship"],
    workOrientation: 0.55,
    experienceYears: 7,
    location: "Northeast",
  },
  {
    id: "c3",
    initials: "AK",
    color: "hsl(30 60% 45%)",
    targetRoles: ["Climate Policy Analyst", "Sustainability Manager"],
    topValues: ["Mission-driven work", "Stability", "Diversity and inclusion"],
    missionAlignmentScore: 95,
    impactCompetencies: ["Systems Thinking", "Resource Stewardship", "Mission Durability"],
    workOrientation: 0.93,
    experienceYears: 5,
    location: "West",
  },
  {
    id: "c4",
    initials: "JD",
    color: "hsl(260 45% 50%)",
    targetRoles: ["Data Scientist", "ML Engineer"],
    topValues: ["Compensation", "Growth opportunities", "Autonomy"],
    missionAlignmentScore: 62,
    impactCompetencies: ["Systems Thinking"],
    workOrientation: 0.3,
    experienceYears: 4,
    location: "Remote",
  },
  {
    id: "c5",
    initials: "SP",
    color: "hsl(200 55% 42%)",
    targetRoles: ["Community Organizer", "Advocacy Director"],
    topValues: ["Mission-driven work", "Diversity and inclusion", "Flexibility"],
    missionAlignmentScore: 88,
    impactCompetencies: ["Narrative Advocacy", "Stakeholder Fluency", "Mission Durability"],
    workOrientation: 0.9,
    experienceYears: 9,
    location: "Southeast",
  },
  {
    id: "c6",
    initials: "LH",
    color: "hsl(340 50% 45%)",
    targetRoles: ["Grants Manager", "Development Officer"],
    topValues: ["Stability", "Mission-driven work", "Team culture"],
    missionAlignmentScore: 84,
    impactCompetencies: ["Resource Stewardship", "Stakeholder Fluency"],
    workOrientation: 0.72,
    experienceYears: 6,
    location: "Midwest",
  },
];

const EXP_LEVELS = [
  { label: "All Levels", value: "all" },
  { label: "1–3 years", value: "1-3" },
  { label: "4–7 years", value: "4-7" },
  { label: "8+ years", value: "8+" },
];

function scoreColor(s: number) {
  if (s >= 70) return "text-civic-green";
  if (s >= 50) return "text-civic-yellow";
  return "text-destructive";
}

function orientationLabel(v: number) {
  if (v >= 0.75) return "Purpose-driven";
  if (v >= 0.45) return "Balanced";
  return "Compensation-focused";
}

/* ─── access-denied view ─── */
function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center py-32 px-6">
      <div className="max-w-md text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-muted-foreground/60" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Employer Access Only</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The talent pool is available to verified employer accounts. Get verified to browse
          mission-aligned candidates matched against your organization's DNA.
        </p>
        <Button onClick={() => navigate("/for-employers")} className="rounded-full gap-2">
          Get Verified <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── page ─── */
export default function Talent() {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, isLoading: roleLoading, isOwner, isAdmin } = useUserRole();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);

  usePageSEO({
    title: "Talent Pool — Mission-Aligned Candidates",
    description:
      "Browse anonymized, values-verified candidates ready to contribute to mission-driven organizations.",
    path: "/talent",
  });

  const isEmployer = hasRole("owner") || hasRole("admin") || isOwner || isAdmin;

  if (authLoading || roleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isEmployer) {
    return <AccessDenied />;
  }

  const filtered = SAMPLE_CANDIDATES.filter((c) => {
    if (search && !c.targetRoles.some((r) => r.toLowerCase().includes(search.toLowerCase()))) return false;
    if (competencyFilter !== "all" && !c.impactCompetencies.includes(competencyFilter)) return false;
    if (c.missionAlignmentScore < minScore) return false;
    if (expFilter !== "all") {
      if (expFilter === "1-3" && (c.experienceYears < 1 || c.experienceYears > 3)) return false;
      if (expFilter === "4-7" && (c.experienceYears < 4 || c.experienceYears > 7)) return false;
      if (expFilter === "8+" && c.experienceYears < 8) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 py-10 px-6 lg:px-16">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-2">
            Talent Pool
          </p>
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">
            Mission-aligned candidates, ready to contribute.
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Every candidate has been matched on values, skills, and mission alignment. They came
            here because they want work that matters.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Competency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competencies</SelectItem>
              {IMPACT_COMPETENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={expFilter} onValueChange={setExpFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              {EXP_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Min alignment:</span>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-xs font-medium text-foreground w-8">{minScore}</span>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No candidates match"
            description="Adjust your filters to see more mission-aligned candidates."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-prominent transition-shadow duration-300">
                <CardContent className="p-6">
                  {/* Avatar + score */}
                  <div className="flex items-start justify-between mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback
                        className="text-sm font-bold text-white"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Mission Alignment
                      </p>
                      <p className={cn("text-xl font-bold tabular-nums", scoreColor(c.missionAlignmentScore))}>
                        {c.missionAlignmentScore}
                      </p>
                    </div>
                  </div>

                  {/* Roles */}
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {c.targetRoles.join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {c.experienceYears} yrs experience · {c.location}
                  </p>

                  {/* Top values */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.topValues.map((v) => (
                      <Badge key={v} variant="secondary" className="text-[10px]">
                        {v}
                      </Badge>
                    ))}
                  </div>

                  {/* Impact competencies */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.impactCompetencies.map((ic) => (
                      <Badge key={ic} variant="outline" className="text-[10px]">
                        {ic}
                      </Badge>
                    ))}
                  </div>

                  {/* Work orientation bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Compensation</span>
                      <span>Purpose</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted relative">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all"
                        style={{ width: `${c.workOrientation * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {orientationLabel(c.workOrientation)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() =>
                      navigate("/for-employers")
                    }
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Request Introduction
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bottom note */}
        <p className="text-center text-xs text-muted-foreground mt-12 max-w-lg mx-auto leading-relaxed">
          Candidate identities are protected until both sides indicate interest. No photos. No
          names. Just alignment.
        </p>
      </div>
    </div>
  );
}
